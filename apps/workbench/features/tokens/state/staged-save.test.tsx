import { ScreenLock } from "@/_shared/shell/screen-lock";
import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { StagedRowActions } from "@/features/tokens/components/staged/row/staged-row-actions";
import { StagedHeader } from "@/features/tokens/components/staged/staged-header";
import {
  StagedContextProvider,
  useStagedContext,
} from "@/features/tokens/state/staged-context";
import { persistDraftModel } from "@/features/tokens/state/staged-draft-storage";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import { StagedView } from "@/features/tokens/views/staged/staged-view";
import type { PublishStagedChangesRequest } from "@repo/contracts/operation";
import type { Token, TokenReference } from "@repo/contracts/type";
import { validSeed } from "@repo/seed-data/valid-seed";
import { Toaster } from "@repo/ui";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const projectId = validSeed.projects[0]!.id;
const base = buildTokenGraphViewModel(
  validSeed.tokenTypes,
  validSeed.tokens,
  validSeed.tokenReferences,
);
const surface = validSeed.tokens.find(
  (token) =>
    token.name === "default" &&
    token.tokenTypeId ===
      validSeed.tokenTypes.find(
        (type) => type.category === "color" && type.name === "surface",
      )?.id,
)!;
const other = validSeed.tokens.find(
  (token) =>
    token.name === "muted" &&
    token.tokenTypeId ===
      validSeed.tokenTypes.find(
        (type) => type.category === "color" && type.name === "surface",
      )?.id,
)!;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <StagedContextProvider projectId={projectId} baseManifest={base}>
      {children}
      <Toaster />
    </StagedContextProvider>
  );
}

function savedResponse(tokens: Token[], references: TokenReference[] = []) {
  return Response.json({ ok: true, release: validSeed.releases[0], tokens, references });
}

function referencesFor(tokenId: string) {
  return validSeed.tokenReferences.filter(
    (reference) => reference.referencingTokenId === tokenId,
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("staged save reconciliation", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("applies all rows and clears persisted draft after success", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      savedResponse(
        [
          { ...surface, name: "one" },
          { ...other, name: "two" },
        ],
        [...referencesFor(surface.id), ...referencesFor(other.id)],
      ),
    );
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => {
      hook.result.current.updateRow(surface.id, { name: "one" });
      hook.result.current.updateRow(other.id, { name: "two" });
    });
    await act(async () => {
      await hook.result.current.applyDraft();
    });
    const payload: PublishStagedChangesRequest = JSON.parse(
      String(fetch.mock.calls[0]?.[1]?.body),
    );
    expect(fetch.mock.calls[0]?.[0]).toBe("/api/releases/publish");
    const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(headers.get("x-dso-csrf")).toBe("1");
    expect(headers.has("idempotency-key")).toBe(false);
    expect(payload.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    expect(payload.changes).toHaveLength(2);
    expect(hook.result.current.changedRowCount).toBe(0);
    await waitFor(() => expect(localStorage.length).toBe(0));
  });

  it("only offers bulk push while preserving individual and bulk discard", async () => {
    function StagedScreen() {
      const { updateRow, canApply } = useStagedContext();
      return (
        <>
          <button
            disabled={!canApply}
            onClick={() => {
              updateRow(surface.id, { name: "first edit" });
              updateRow(other.id, { name: "second edit" });
            }}
          >
            Edit rows
          </button>
          <StagedHeader onBack={() => {}} />
          <StagedView />
        </>
      );
    }

    render(<StagedScreen />, { wrapper });
    await waitFor(() => expect(screen.getByText("Edit rows")).toBeEnabled());
    fireEvent.click(screen.getByText("Edit rows"));
    expect(screen.getAllByLabelText("discard-row")).toHaveLength(2);
    expect(screen.queryByLabelText("apply-row")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PUSH ALL" })).toBeEnabled();

    fireEvent.click(screen.getAllByLabelText("discard-row")[0]!);
    expect(screen.getAllByLabelText("discard-row")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "DISCARD ALL" }));
    expect(screen.getByText("No staged changes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PUSH ALL" })).not.toBeInTheDocument();
  });

  it("clears a known push error when the draft is discarded", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { ok: false, error: { message: "The staged changes conflict." } },
        { status: 409 },
      ),
    );
    function StagedScreen() {
      const { updateRow, canApply } = useStagedContext();
      return (
        <>
          <button
            disabled={!canApply}
            onClick={() => updateRow(surface.id, { name: "edit" })}
          >
            Edit
          </button>
          <StagedHeader onBack={() => {}} />
          <StagedView />
        </>
      );
    }
    render(<StagedScreen />, { wrapper });
    await waitFor(() => expect(screen.getByText("Edit")).toBeEnabled());
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByRole("button", { name: "PUSH ALL" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The staged changes conflict.",
    );
    fireEvent.click(screen.getByRole("button", { name: "DISCARD ALL" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByText("No staged changes")).toBeInTheDocument();
  });

  it("shows a persistent toast for a stale draft until it is discarded", async () => {
    const updatedBase = {
      ...base,
      tokenTypes: base.tokenTypes.map((type) => ({
        ...type,
        values: type.values.map((row) =>
          row.id === surface.id ? { ...row, name: "server edit" } : row,
        ),
      })),
    };
    const draft = {
      ...base,
      tokenTypes: base.tokenTypes.map((type) => ({
        ...type,
        values: type.values.map((row) =>
          row.id === surface.id ? { ...row, name: "draft edit" } : row,
        ),
      })),
    };
    persistDraftModel(projectId, base, draft);
    const toast = vi.spyOn(Toaster.toast, "error");
    render(
      <StagedContextProvider projectId={projectId} baseManifest={updatedBase}>
        <StagedHeader onBack={() => {}} />
        <StagedView />
        <Toaster />
      </StagedContextProvider>,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Project data changed since this draft was created.");
    expect(alert.closest("[data-sonner-toast]")).toHaveAttribute(
      "data-dismissible",
      "false",
    );
    expect(toast).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: Infinity, dismissible: false }),
    );
    expect(screen.getByRole("button", { name: "PUSH ALL" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "DISCARD ALL" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("shows a draft restoration error until the invalid draft is discarded", async () => {
    localStorage.setItem(`dso-workbench-staged-draft:${projectId}`, "invalid json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <>
        <StagedHeader onBack={() => {}} />
        <StagedView />
      </>,
      { wrapper },
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The saved draft could not be restored.",
    );
    expect(screen.getByRole("button", { name: "PUSH ALL" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "DISCARD ALL" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("recreates an active error toast when the staged view is reopened", async () => {
    localStorage.setItem(`dso-workbench-staged-draft:${projectId}`, "invalid json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const toast = vi.spyOn(Toaster.toast, "error");
    const dismiss = vi.spyOn(Toaster.toast, "dismiss");
    function StagedScreen() {
      const [showStaged, setShowStaged] = useState(true);
      return (
        <>
          <button onClick={() => setShowStaged((show) => !show)}>Toggle staged</button>
          {showStaged && <StagedView />}
        </>
      );
    }

    render(<StagedScreen />, { wrapper });
    const firstAlert = await screen.findByRole("alert");
    expect(firstAlert).toHaveTextContent("The saved draft could not be restored.");
    const firstId = toast.mock.results[0]!.value;
    fireEvent.click(screen.getByText("Toggle staged"));
    expect(dismiss).toHaveBeenCalledWith(firstId);
    fireEvent.click(screen.getByText("Toggle staged"));
    expect(toast).toHaveBeenCalledTimes(2);
    const secondId = toast.mock.results[1]!.value;
    expect(secondId).not.toBe(firstId);
    await waitFor(() => expect(firstAlert).not.toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The saved draft could not be restored.",
    );
    expect(Toaster.toast.getToasts().some((item) => item.id === secondId)).toBe(true);
  });

  it("preserves the draft and disables both discards when the push outcome is unknown", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    function StagedScreen() {
      const { updateRow, canApply } = useStagedContext();
      return (
        <>
          <button
            disabled={!canApply}
            onClick={() => updateRow(surface.id, { name: "edit" })}
          >
            Edit
          </button>
          <StagedHeader onBack={() => {}} />
          <StagedView />
        </>
      );
    }
    const dismiss = vi.spyOn(Toaster.toast, "dismiss");
    const { unmount } = render(<StagedScreen />, { wrapper });
    await waitFor(() => expect(screen.getByText("Edit")).toBeEnabled());
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByRole("button", { name: "PUSH ALL" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Push outcome is unknown. Your draft was preserved. Retry without changing it.",
    );
    expect(screen.getByLabelText("discard-row")).toBeDisabled();
    expect(screen.getByRole("button", { name: "DISCARD ALL" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "PUSH ALL" })).toBeEnabled();
    unmount();
    expect(dismiss).toHaveBeenCalledWith(expect.anything());
  });

  it("rebuilds dependent previews and restores the remaining draft after reload", async () => {
    const primitive = validSeed.tokens.find((token) => token.name === "neutral-0")!;
    const value = { kind: "single", value: "#123456" } as const;
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(primitive.id, { value }));
    let request!: Promise<Response>;
    act(() => {
      request = hook.result.current.applyDraft();
    });
    act(() => hook.result.current.updateRow(other.id, { name: "remaining" }));
    await act(async () => {
      pending.resolve(
        savedResponse([{ ...primitive, value }], referencesFor(primitive.id)),
      );
      await request;
    });
    expect(findRowById(hook.result.current.baseModel, surface.id)?.preview).toMatchObject(
      {
        kind: "modes",
        light: "#123456",
      },
    );
    await waitFor(() => expect(localStorage.length).toBe(1));
    hook.unmount();
    const savedBase = buildTokenGraphViewModel(
      validSeed.tokenTypes,
      validSeed.tokens.map((token) =>
        token.id === primitive.id ? { ...token, value } : token,
      ),
      validSeed.tokenReferences,
    );
    const reloaded = renderHook(() => useStagedContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StagedContextProvider projectId={projectId} baseManifest={savedBase}>
          {children}
        </StagedContextProvider>
      ),
    });
    await waitFor(() => expect(reloaded.result.current.canApply).toBe(true));
    expect(reloaded.result.current.changedRowCount).toBe(1);
    expect(findRowById(reloaded.result.current.draftModel, other.id)?.name).toBe(
      "remaining",
    );
  });

  it("retains edits to the same field and other rows while a request is in flight", async () => {
    const pending = deferred<Response>();
    const fetch = vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "sent" }));
    let request!: Promise<Response>;
    act(() => {
      request = hook.result.current.applyDraft();
    });

    expect(hook.result.current.isApplying).toBe(true);
    await act(async () => {
      expect((await hook.result.current.applyDraft()).status).toBe(409);
    });
    act(() => {
      hook.result.current.updateRow(surface.id, { name: "later" });
      hook.result.current.updateRow(other.id, { name: "another" });
    });
    await act(async () => {
      pending.resolve(
        savedResponse([{ ...surface, name: "sent" }], referencesFor(surface.id)),
      );
      await request;
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(findRowById(hook.result.current.baseModel, surface.id)?.name).toBe("sent");
    expect(findRowById(hook.result.current.draftModel, surface.id)?.name).toBe("later");
    expect(
      hook.result.current.changedRows.find((row) => row.rowId === surface.id)?.change
        .name,
    ).toEqual({ before: "sent", after: "later" });
    expect(hook.result.current.changedRowCount).toBe(2);
    expect(hook.result.current.isApplying).toBe(false);
  });

  it("disables push and discard controls while a request is in flight", async () => {
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    function Controls() {
      const { updateRow, isApplying, outcomeUnknown, discardRow } = useStagedContext();
      return (
        <>
          <button onClick={() => updateRow(surface.id, { name: "sent" })}>Edit</button>
          <StagedHeader onBack={() => {}} />
          <StagedRowActions
            rowId={surface.id}
            disabled={isApplying || outcomeUnknown}
            onDiscard={discardRow}
          />
        </>
      );
    }
    render(<Controls />, { wrapper });
    await waitFor(() => expect(screen.getByLabelText("discard-row")).toBeEnabled());
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.queryByLabelText("apply-row")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "PUSH ALL" }));
    expect(screen.getByLabelText("discard-row")).toBeDisabled();
    expect(screen.getByRole("button", { name: "PUSHING..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "DISCARD ALL" })).toBeDisabled();
    await act(async () => {
      pending.resolve(
        savedResponse([{ ...surface, name: "sent" }], referencesFor(surface.id)),
      );
      await pending.promise;
    });
  });

  it.each(["success", "failure"] as const)(
    "locks the workbench until an Apply %s response is handled",
    async (outcome) => {
      const pending = deferred<Response>();
      vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);

      function Workbench() {
        const { updateRow, applyDraft, baseModel, canApply, saveError } =
          useStagedContext();
        return (
          <ScreenLock>
            <button
              disabled={!canApply}
              onClick={() => updateRow(surface.id, { name: "sent" })}
            >
              Edit
            </button>
            <button onClick={() => void applyDraft()}>Apply</button>
            <button>Back</button>
            <span>Base: {findRowById(baseModel, surface.id)?.name}</span>
            {saveError && <p role="alert">{saveError}</p>}
          </ScreenLock>
        );
      }

      render(<Workbench />, { wrapper });
      await waitFor(() => expect(screen.getByText("Edit")).toBeEnabled());
      fireEvent.click(screen.getByText("Edit"));
      fireEvent.click(screen.getByText("Apply"));

      const content = screen.getByText("Back").parentElement!;
      expect(content).toHaveAttribute("inert");
      expect(content).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("status")).toHaveTextContent("PUSHING CHANGES...");

      await act(async () => {
        pending.resolve(
          outcome === "success"
            ? savedResponse([{ ...surface, name: "sent" }], referencesFor(surface.id))
            : new Response("Save failed", { status: 400 }),
        );
        await pending.promise;
      });

      await waitFor(() => expect(content).not.toHaveAttribute("inert"));
      expect(content).toHaveAttribute("aria-busy", "false");
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      if (outcome === "success") {
        expect(screen.getByText("Base: sent")).toBeInTheDocument();
      } else {
        expect(screen.getByRole("alert")).toHaveTextContent("Push failed");
      }
    },
  );

  it("merges later slot edits without restoring previously saved slots", async () => {
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    const original = findRowById(base, surface.id)!;
    act(() =>
      hook.result.current.updateRow(surface.id, {
        references: { ...original.references, light: undefined },
      }),
    );
    let request!: Promise<Response>;
    act(() => {
      request = hook.result.current.applyDraft();
    });
    act(() =>
      hook.result.current.updateRow(surface.id, {
        references: { ...original.references, light: undefined, dark: undefined },
      }),
    );
    await act(async () => {
      pending.resolve(
        savedResponse(
          [surface],
          referencesFor(surface.id).filter((ref) => ref.slot !== "light"),
        ),
      );
      await request;
    });
    const row = hook.result.current.changedRows[0]!;
    expect(row.change.references).toEqual([
      { slot: "dark", beforeTokenId: original.references!.dark, afterTokenId: null },
    ]);
  });

  it("keeps a later revert as a new staged change after the save completes", async () => {
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "sent" }));
    let request!: Promise<Response>;
    act(() => {
      request = hook.result.current.applyDraft();
    });
    act(() => hook.result.current.updateRow(surface.id, { name: surface.name }));
    await act(async () => {
      pending.resolve(
        savedResponse([{ ...surface, name: "sent" }], referencesFor(surface.id)),
      );
      await request;
    });
    expect(hook.result.current.changedRows[0]?.change.name).toEqual({
      before: "sent",
      after: surface.name,
    });
  });

  it("rejects oversized batches without splitting or sending them", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "x".repeat(1_000_001) }));
    await act(async () => {
      expect((await hook.result.current.applyDraft()).status).toBe(413);
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(hook.result.current.changedRowCount).toBe(1);
    expect(hook.result.current.saveError).toContain("push limit");
  });

  it("retries an unknown outcome with the same request ID while freezing the draft", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(savedResponse([{ ...surface, name: "draft" }]));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "draft" }));
    await act(async () => {
      expect((await hook.result.current.applyDraft()).status).toBe(503);
    });
    expect(hook.result.current.outcomeUnknown).toBe(true);
    expect(hook.result.current.canApply).toBe(true);
    expect(findRowById(hook.result.current.baseModel, surface.id)?.name).toBe(
      surface.name,
    );
    expect(findRowById(hook.result.current.draftModel, surface.id)?.name).toBe("draft");
    const firstRequest = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body));
    act(() => hook.result.current.updateRow(surface.id, { name: "later edit" }));
    expect(hook.result.current.saveError).toContain("Push outcome is unknown");
    expect(findRowById(hook.result.current.draftModel, surface.id)?.name).toBe("draft");

    await act(async () => {
      expect((await hook.result.current.applyDraft()).status).toBe(200);
    });
    const secondRequest = JSON.parse(String(fetch.mock.calls[1]?.[1]?.body));
    expect(secondRequest.requestId).toBe(firstRequest.requestId);
    expect(secondRequest.changes).toEqual(firstRequest.changes);
    expect(hook.result.current.outcomeUnknown).toBe(false);
    expect(hook.result.current.canApply).toBe(true);
    await waitFor(() => expect(localStorage.length).toBe(0));
  });

  it("does not accept an incomplete successful response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(savedResponse([]));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "draft" }));
    await act(async () => {
      await hook.result.current.applyDraft();
    });
    expect(hook.result.current.outcomeUnknown).toBe(true);
    expect(hook.result.current.changedRowCount).toBe(1);
  });

  it("does not clear the draft if a successful response has no published release", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
        tokens: [{ ...surface, name: "draft" }],
        references: referencesFor(surface.id),
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "draft" }));
    await act(async () => {
      await hook.result.current.applyDraft();
    });
    expect(hook.result.current.outcomeUnknown).toBe(true);
    expect(hook.result.current.changedRowCount).toBe(1);
  });

  it("reports conflict details and keeps base and draft intact", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ok: false,
          error: {
            code: "staged-changes-conflict",
            message: "The staged changes conflict with current project data.",
            issues: [
              { tokenId: surface.id, field: "name", message: "Token name has changed." },
            ],
          },
        },
        { status: 409 },
      ),
    );
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "draft" }));
    await act(async () => {
      await hook.result.current.applyDraft();
    });
    expect(hook.result.current.saveError).toContain("Token name has changed.");
    expect(hook.result.current.saveError).toContain(surface.id);
    expect(hook.result.current.outcomeUnknown).toBe(false);
    expect(findRowById(hook.result.current.baseModel, surface.id)?.name).toBe(
      surface.name,
    );
    expect(findRowById(hook.result.current.draftModel, surface.id)?.name).toBe("draft");
    act(() => hook.result.current.discardRow(surface.id));
    expect(hook.result.current.saveError).toBeNull();
    expect(hook.result.current.changedRowCount).toBe(0);
  });
});
