import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { createTokenDisplayResolver } from "@/features/tokens/model/token-display";
import {
  StagedContextProvider,
  useStagedContext,
} from "@/features/tokens/state/staged-context";
import { persistDraftModel } from "@/features/tokens/state/staged-draft-storage";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import { validSeed } from "@repo/seed-data/valid-seed";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const baseModel = buildTokenGraphViewModel(
  validSeed.tokenTypes,
  validSeed.tokens,
  validSeed.tokenReferences,
);

function wrapper({ children }: { children: ReactNode }) {
  return (
    <StagedContextProvider projectId={validSeed.projects[0]!.id} baseManifest={baseModel}>
      {children}
    </StagedContextProvider>
  );
}

describe("staged draft reload", () => {
  afterEach(() => localStorage.clear());

  it("retains the draft when the save endpoint rejects the request", async () => {
    const token = validSeed.tokens.find((item) => item.name === "surface")!;
    const current = renderHook(() => useStagedContext(), { wrapper });
    act(() => current.result.current.updateRow(token.id, { name: "draft edit" }));
    await waitFor(() => expect(current.result.current.changedRowCount).toBe(1));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          ok: false,
          error: {
            code: "authentication-required",
            message: "Authentication is required.",
          },
        },
        { status: 401 },
      ),
    );
    await act(async () => {
      expect((await current.result.current.applyDraft()).status).toBe(401);
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("/api/design-tokens/staged-changes");
    expect(current.result.current.saveError).toContain("Authentication is required");
    expect(findRowById(current.result.current.draftModel, token.id)?.name).toBe(
      "draft edit",
    );
    expect(localStorage.length).toBe(1);
    fetchSpy.mockRestore();
    current.unmount();
  });

  it.each([
    { name: "surface", kind: "modes", slot: "light" },
    { name: "body", kind: "typography", slot: "fontSize" },
  ] as const)(
    "restores a cleared $kind slot and falls back to the original without a draft",
    async ({ name, kind, slot }) => {
      const token = validSeed.tokens.find(
        (item) => item.name === name && item.value.kind === kind,
      )!;
      const original = findRowById(baseModel, token.id)!;
      const type = baseModel.tokenTypes.find((item) => item.id === token.tokenTypeId)!;
      expect(original.references?.[slot]).toBeDefined();

      const first = renderHook(() => useStagedContext(), { wrapper });
      await waitFor(() => expect(localStorage.length).toBe(0));
      act(() => {
        first.result.current.updateRow(token.id, {
          references: { ...original.references, [slot]: undefined },
        });
      });
      await waitFor(() => expect(localStorage.length).toBe(1));
      first.unmount();

      const reloaded = renderHook(() => useStagedContext(), { wrapper });
      await waitFor(() =>
        expect(
          findRowById(reloaded.result.current.draftModel, token.id)?.references?.[slot],
        ).toBeUndefined(),
      );
      const restored = findRowById(reloaded.result.current.draftModel, token.id)!;
      const display = createTokenDisplayResolver(reloaded.result.current.draftModel)(
        restored,
        type,
      );
      expect(display.value.meta).toContain("unset");
      expect(display.missingReference).toBe(false);
      if (kind === "typography") {
        expect(display.value.preview).toBeUndefined();
      } else {
        expect(display.value.preview).not.toHaveProperty(slot, expect.any(String));
      }

      act(() => reloaded.result.current.resetDraft());
      await waitFor(() => expect(localStorage.length).toBe(0));
      reloaded.unmount();
      const fresh = renderHook(() => useStagedContext(), { wrapper });
      expect(
        findRowById(fresh.result.current.draftModel, token.id)?.references?.[slot],
      ).toBe(original.references?.[slot]);
      fresh.unmount();
    },
  );

  it("preserves the original baseline and blocks stale drafts until discarded", async () => {
    const token = validSeed.tokens.find((item) => item.name === "surface")!;
    const row = findRowById(baseModel, token.id)!;
    const first = renderHook(() => useStagedContext(), { wrapper });
    act(() => first.result.current.updateRow(token.id, { name: "my edit" }));
    await waitFor(() => expect(localStorage.length).toBe(1));
    first.unmount();

    const newerBase = {
      ...baseModel,
      tokenTypes: baseModel.tokenTypes.map((type) => ({
        ...type,
        values: type.values.map((value) =>
          value.id === token.id ? { ...value, name: "server edit" } : value,
        ),
      })),
    };
    const reloaded = renderHook(() => useStagedContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StagedContextProvider
          projectId={validSeed.projects[0]!.id}
          baseManifest={newerBase}
        >
          {children}
        </StagedContextProvider>
      ),
    });
    await waitFor(() => expect(reloaded.result.current.isStaleDraft).toBe(true));
    expect(
      reloaded.result.current.changedRows.find((item) => item.rowId === token.id)?.change
        .name,
    ).toEqual({ before: row.name, after: "my edit" });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await reloaded.result.current.applyDraft()).status).toBe(409);
    expect((await reloaded.result.current.applyRow(token.id)).status).toBe(409);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    act(() => reloaded.result.current.resetDraft());
    await waitFor(() => expect(reloaded.result.current.isStaleDraft).toBe(false));
    expect(findRowById(reloaded.result.current.draftModel, token.id)?.name).toBe(
      "server edit",
    );
    await waitFor(() => expect(localStorage.length).toBe(0));
    reloaded.unmount();
  });

  it("keeps projects' drafts separate", async () => {
    const otherProject = "other-project";
    const token = validSeed.tokens.find((item) => item.name === "surface")!;
    const changed = {
      ...baseModel,
      tokenTypes: baseModel.tokenTypes.map((type) => ({
        ...type,
        values: type.values.map((row) =>
          row.id === token.id ? { ...row, name: "other project draft" } : row,
        ),
      })),
    };
    persistDraftModel(otherProject, baseModel, changed);
    const current = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(current.result.current.isStaleDraft).toBe(false));
    expect(findRowById(current.result.current.draftModel, token.id)?.name).toBe(
      token.name,
    );
    expect(localStorage.length).toBe(1);
    current.unmount();
    const other = renderHook(() => useStagedContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StagedContextProvider projectId={otherProject} baseManifest={baseModel}>
          {children}
        </StagedContextProvider>
      ),
    });
    await waitFor(() =>
      expect(findRowById(other.result.current.draftModel, token.id)?.name).toBe(
        "other project draft",
      ),
    );
    other.unmount();
  });

  it("does not overwrite an invalid stored draft until explicitly discarded", async () => {
    const key = `dso-workbench-staged-draft:${validSeed.projects[0]!.id}`;
    localStorage.setItem(key, "invalid json");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const current = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(current.result.current.draftLoadError).toBe(true));
    expect(localStorage.getItem(key)).toBe("invalid json");
    expect((await current.result.current.applyDraft()).status).toBe(409);
    act(() => current.result.current.resetDraft());
    await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
    warn.mockRestore();
    current.unmount();
  });

  it("preserves a structurally invalid stored draft instead of crashing or overwriting it", async () => {
    const projectId = validSeed.projects[0]!.id;
    const key = `dso-workbench-staged-draft:${projectId}`;
    const invalid = JSON.stringify({
      version: 2,
      projectId,
      baseModel: { tokenTypes: [null] },
      draftModel: { tokenTypes: [] },
    });
    localStorage.setItem(key, invalid);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const current = renderHook(() => useStagedContext(), { wrapper });
    await waitFor(() => expect(current.result.current.draftLoadError).toBe(true));
    expect(localStorage.getItem(key)).toBe(invalid);
    current.unmount();
    warn.mockRestore();
  });
});
