import { Dispatch, SetStateAction, useCallback } from "react";
import {
  TokenGraphModel,
  buildManifestFromGraph,
} from "../../tokens/lib/manifestAdapter";
import { clearPersistedDraftModel } from "../context/stagedDraftStorage";
import {
  buildChangedRows,
  findRowById,
  replaceRowInModel,
} from "../context/stagedManifestModel";

type UseStagedManifestActionsProps = {
  baseModel: TokenGraphModel;
  draftModel: TokenGraphModel;
  setBaseModel: Dispatch<SetStateAction<TokenGraphModel>>;
  setDraftModel: Dispatch<SetStateAction<TokenGraphModel>>;
};

export function useStagedManifestActions({
  baseModel,
  draftModel,
  setBaseModel,
  setDraftModel,
}: UseStagedManifestActionsProps) {
  const updateRow = useCallback(
    (rowId: string, update: Partial<any>) => {
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
    const manifest = buildManifestFromGraph(draftModel);

    const response = await fetch("/api/design-tokens/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest: manifest }),
    });

    if (response.ok) {
      setBaseModel(draftModel);
      setDraftModel(draftModel);
      clearPersistedDraftModel();
    }

    return response;
  }, [draftModel, setBaseModel, setDraftModel]);

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
