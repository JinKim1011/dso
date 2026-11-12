import { buildManifestFromGraph } from "@/features/tokens/adapters/manifest/to-manifest";
import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import { clearPersistedDraftModel } from "@/features/tokens/state/staged-draft-storage";
import {
  buildChangedRows,
  findRowById,
  replaceRowInModel,
} from "@/features/tokens/state/staged-graph-model";
import { Dispatch, SetStateAction, useCallback } from "react";

type UseStagedManifestActionsProps = {
  projectId: string;
  canApply: boolean;
  baseModel: TokenGraphViewModel;
  draftModel: TokenGraphViewModel;
  setBaseModel: Dispatch<SetStateAction<TokenGraphViewModel>>;
  setDraftModel: Dispatch<SetStateAction<TokenGraphViewModel>>;
};

export function useStagedManifestActions({
  projectId,
  canApply,
  baseModel,
  draftModel,
  setBaseModel,
  setDraftModel,
}: UseStagedManifestActionsProps) {
  const updateRow = useCallback(
    (rowId: string, update: Partial<TokenValueViewModel>) => {
      setDraftModel((current) => ({
        ...current,
        tokenTypes: current.tokenTypes.map((tokenType) => ({
          ...tokenType,
          values: tokenType.values.map((value) =>
            value.id === rowId ? { ...value, ...update } : value,
          ),
        })),
      }));
    },
    [setDraftModel],
  );

  const discardRow = useCallback(
    (rowId: string) => {
      const baseRow = findRowById(baseModel, rowId);
      if (!baseRow) return;

      setDraftModel((current) => replaceRowInModel(current, rowId, baseRow));
    },
    [baseModel, setDraftModel],
  );

  const resetDraft = useCallback(() => {
    setDraftModel(baseModel);
  }, [baseModel, setDraftModel]);

  const applyDraft = useCallback(async (): Promise<Response> => {
    if (!canApply) {
      return new Response("Draft is not ready to apply. Discard the stale draft first.", {
        status: 409,
      });
    }
    const manifest = buildManifestFromGraph(draftModel);

    const response = await fetch("/api/design-tokens/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest: manifest }),
    });

    if (response.ok) {
      setBaseModel(draftModel);
      setDraftModel(draftModel);
      clearPersistedDraftModel(projectId);
    }

    return response;
  }, [canApply, draftModel, projectId, setBaseModel, setDraftModel]);

  const applyRow = useCallback(
    async (rowId: string): Promise<Response> => {
      const draftRow = findRowById(draftModel, rowId);
      if (!draftRow) {
        return new Response("Row not found in draft model", { status: 404 });
      }

      const nextBaseModel = replaceRowInModel(baseModel, rowId, draftRow);
      const manifest = buildManifestFromGraph(nextBaseModel);

      const response = await fetch("/api/design-tokens/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest }),
      });

      if (response.ok) {
        setBaseModel(nextBaseModel);

        const hasPendingChanges = buildChangedRows(nextBaseModel, draftModel).length > 0;
        if (!hasPendingChanges) {
          clearPersistedDraftModel();
        }
      }

      return response;
    },
    [baseModel, draftModel, setBaseModel],
  );

  return {
    updateRow,
    discardRow,
    resetDraft,
    applyDraft,
    applyRow,
  };
}
