import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import {
  findRowById,
  replaceRowInModel,
} from "@/features/tokens/state/staged-graph-model";
import { Dispatch, SetStateAction, useCallback } from "react";

type UseStagedManifestActionsProps = {
  canApply: boolean;
  baseModel: TokenGraphViewModel;
  draftModel: TokenGraphViewModel;
  setDraftModel: Dispatch<SetStateAction<TokenGraphViewModel>>;
};

export function useStagedManifestActions({
  canApply,
  baseModel,
  draftModel,
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
    return new Response("PostgreSQL saving is not available yet.", { status: 503 });
  }, [canApply]);

  const applyRow = useCallback(
    async (rowId: string): Promise<Response> => {
      if (!canApply) {
        return new Response(
          "Draft is not ready to apply. Discard the stale draft first.",
          {
            status: 409,
          },
        );
      }
      if (!findRowById(draftModel, rowId)) {
        return new Response("Row not found in draft model", { status: 404 });
      }
      return new Response("PostgreSQL saving is not available yet.", { status: 503 });
    },
    [canApply, draftModel],
  );

  return {
    updateRow,
    discardRow,
    resetDraft,
    applyDraft,
    applyRow,
  };
}
