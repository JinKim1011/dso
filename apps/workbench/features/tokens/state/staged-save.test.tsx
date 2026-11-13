import { ScreenLock } from "@/_shared/shell/screen-lock";
import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { StagedRowActions } from "@/features/tokens/components/staged/row/staged-row-actions";
import { StagedHeader } from "@/features/tokens/components/staged/staged-header";
import {
  StagedManifestProvider,
  useStagedContext,
} from "@/features/tokens/state/staged-context";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import type { Token, TokenReference } from "@repo/contracts/type";
import { validSeed } from "@repo/seed-data/valid-seed";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const projectId = validSeed.projects[0]!.id;
const base = buildTokenGraphViewModel(
  validSeed.tokenTypes,
  validSeed.tokens,
  validSeed.tokenReferences,
);
const surface = validSeed.tokens.find((token) => token.name === "surface")!;
const other = validSeed.tokens.find((token) => token.name === "surface-muted")!;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <StagedManifestProvider projectId={projectId} baseManifest={base}>
      {children}
    </StagedManifestProvider>
  );
}

function savedResponse(tokens: Token[], references: TokenReference[] = []) {
  return Response.json({ ok: true, tokens, references });
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

  it("applies one row and preserves unrelated changes", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        savedResponse([{ ...surface, name: "saved" }], referencesFor(surface.id)),
      );
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => {
      hook.result.current.updateRow(surface.id, { name: "saved" });
      hook.result.current.updateRow(other.id, { name: "not-saved" });
    });
    await act(async () => {
      expect((await hook.result.current.applyRow(surface.id)).status).toBe(200);
    });
    const payload: SaveStagedChangesRequest = JSON.parse(
      String(fetch.mock.calls[0]?.[1]?.body),
    );
    expect(payload.changes).toHaveLength(1);
    expect(payload.changes[0]).toMatchObject({
      tokenId: surface.id,
      name: { before: surface.name, after: "saved" },
    });
    expect(findRowById(hook.result.current.baseModel, surface.id)?.name).toBe("saved");
    expect(findRowById(hook.result.current.draftModel, surface.id)?.name).toBe("saved");
    expect(findRowById(hook.result.current.baseModel, other.id)?.name).toBe(other.name);
    expect(findRowById(hook.result.current.draftModel, other.id)?.name).toBe("not-saved");
    expect(hook.result.current.changedRowCount).toBe(1);
    await waitFor(() => expect(localStorage.length).toBe(1));
    hook.unmount();
    const savedBase = buildTokenGraphViewModel(
      validSeed.tokenTypes,
      validSeed.tokens.map((token) =>
        token.id === surface.id ? { ...token, name: "saved" } : token,
      ),
      validSeed.tokenReferences,
    );
    const reloaded = renderHook(() => useStagedContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StagedManifestProvider projectId={projectId} baseManifest={savedBase}>
          {children}
        </StagedManifestProvider>
      ),
    });
    await waitFor(() => expect(reloaded.result.current.canApply).toBe(true));
    expect(reloaded.result.current.isStaleDraft).toBe(false);
    expect(findRowById(reloaded.result.current.draftModel, other.id)?.name).toBe(
      "not-saved",
    );
    expect(reloaded.result.current.changedRowCount).toBe(1);
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
    const payload: SaveStagedChangesRequest = JSON.parse(
      String(fetch.mock.calls[0]?.[1]?.body),
    );
    expect(payload.changes).toHaveLength(2);
    expect(hook.result.current.changedRowCount).toBe(0);
    await waitFor(() => expect(localStorage.length).toBe(0));
  });

  it("rebuilds dependent previews and restores the remaining draft after reload", async () => {
    const primitive = validSeed.tokens.find((token) => token.name === "neutral-0")!;
    const value = { kind: "single", value: "#123456" } as const;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      savedResponse([{ ...primitive, value }], referencesFor(primitive.id)),
    );
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => {
      hook.result.current.updateRow(primitive.id, { value });
      hook.result.current.updateRow(other.id, { name: "remaining" });
    });
    await act(async () => {
      await hook.result.current.applyRow(primitive.id);
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
        <StagedManifestProvider projectId={projectId} baseManifest={savedBase}>
          {children}
        </StagedManifestProvider>
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
      request = hook.result.current.applyRow(surface.id);
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

  it("disables Apply controls while a request is in flight", async () => {
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    function Controls() {
      const { updateRow, isApplying, canApply, applyRow, discardRow } =
        useStagedContext();
      return (
        <>
          <button onClick={() => updateRow(surface.id, { name: "sent" })}>Edit</button>
          <StagedHeader onBack={() => {}} />
          <StagedRowActions
            rowId={surface.id}
            isApplying={isApplying}
            canApply={canApply}
            onApply={applyRow}
            onDiscard={discardRow}
          />
        </>
      );
    }
    render(<Controls />, { wrapper });
    await waitFor(() => expect(screen.getByLabelText("apply-row")).toBeEnabled());
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByLabelText("apply-row"));
    expect(screen.getByLabelText("apply-row")).toBeDisabled();
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
        const { updateRow, applyRow, baseModel, canApply, saveError } =
          useStagedContext();
        return (
          <ScreenLock>
            <button
              disabled={!canApply}
              onClick={() => updateRow(surface.id, { name: "sent" })}
            >
              Edit
            </button>
            <button onClick={() => void applyRow(surface.id)}>Apply</button>
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
      expect(screen.getByRole("status")).toHaveTextContent("Applying changes");

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
        expect(screen.getByRole("alert")).toHaveTextContent("Save failed");
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
      request = hook.result.current.applyRow(surface.id);
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
      request = hook.result.current.applyRow(surface.id);
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
    expect(hook.result.current.saveError).toContain("save limit");
  });

  it("blocks further saves and preserves the draft when the outcome is unknown", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const hook = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(hook.result.current.canApply).toBe(true));
    act(() => hook.result.current.updateRow(surface.id, { name: "draft" }));
    await act(async () => {
      expect((await hook.result.current.applyDraft()).status).toBe(503);
    });
    expect(hook.result.current.outcomeUnknown).toBe(true);
    expect(hook.result.current.canApply).toBe(false);
    expect(findRowById(hook.result.current.baseModel, surface.id)?.name).toBe(
      surface.name,
    );
    expect(findRowById(hook.result.current.draftModel, surface.id)?.name).toBe("draft");
    expect((await hook.result.current.applyDraft()).status).toBe(409);
    expect(fetch).toHaveBeenCalledOnce();
    await waitFor(() => expect(localStorage.length).toBe(1));
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
  });
});
