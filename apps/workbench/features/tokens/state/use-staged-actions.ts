import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import {
  buildChangedRows,
  findRowById,
  replaceRowInModel,
} from "@/features/tokens/state/staged-graph-model";
import {
  parseSavedRows,
  reconcileSavedRows,
} from "@/features/tokens/state/staged-save-result";
import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { isRecord } from "@repo/contracts/validation/operations/common";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type StagedModels = {
  baseModel: TokenGraphViewModel;
  draftModel: TokenGraphViewModel;
};

type UseStagedManifestActionsProps = {
  projectId: string;
  canApply: boolean;
  models: StagedModels;
  setModels: Dispatch<SetStateAction<StagedModels>>;
};

export function useStagedManifestActions({
  projectId,
  canApply,
  models,
  setModels,
}: UseStagedManifestActionsProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [completion, setCompletion] = useState(0);
  const busy = useRef(false);

  useLayoutEffect(() => {
    if (!isApplying) busy.current = false;
  }, [isApplying, completion]);

  const updateRow = useCallback(
    (rowId: string, update: Partial<TokenValueViewModel>) => {
      setModels((current) => ({
        ...current,
        draftModel: {
          ...current.draftModel,
          tokenTypes: current.draftModel.tokenTypes.map((tokenType) => ({
            ...tokenType,
            values: tokenType.values.map((value) =>
              value.id === rowId ? { ...value, ...update } : value,
            ),
          })),
        },
      }));
    },
    [setModels],
  );

  const discardRow = useCallback(
    (rowId: string) => {
      setModels((current) => {
        const baseRow = findRowById(current.baseModel, rowId);
        return baseRow
          ? {
              ...current,
              draftModel: replaceRowInModel(current.draftModel, rowId, baseRow),
            }
          : current;
      });
    },
    [setModels],
  );

  const resetDraft = useCallback(() => {
    setModels((current) => ({ ...current, draftModel: current.baseModel }));
  }, [setModels]);

  const apply = useCallback(
    async (rowId?: string): Promise<Response> => {
      if (!canApply || outcomeUnknown) {
        return new Response("Draft is not ready to apply.", { status: 409 });
      }
      if (busy.current)
        return new Response("A save is already in progress.", { status: 409 });
      const changed = buildChangedRows(models.baseModel, models.draftModel);
      const rows = rowId ? changed.filter((row) => row.rowId === rowId) : changed;
      if (rows.length === 0) {
        const message = rowId ? "No staged changes for this row." : "No staged changes.";
        setSaveError(message);
        return new Response(message, { status: 400 });
      }
      const request: SaveStagedChangesRequest = {
        projectId,
        changes: rows.map((row) => row.change),
      };
      const body = JSON.stringify(request);
      if (
        rows.length > CONTRACT_LIMITS.collectionItems ||
        new TextEncoder().encode(body).byteLength > CONTRACT_LIMITS.requestBodyBytes
      ) {
        const message =
          "The staged batch exceeds the save limit. Apply smaller selections.";
        setSaveError(message);
        return new Response(message, { status: 413 });
      }
      busy.current = true;
      setIsApplying(true);
      setSaveError(null);
      try {
        const response = await fetch("/api/design-tokens/staged-changes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!response.ok) {
          let message = `Save failed (${response.status}). Your draft was preserved.`;
          try {
            const payload: unknown = await response.clone().json();
            if (
              isRecord(payload) &&
              isRecord(payload.error) &&
              typeof payload.error.message === "string"
            ) {
              message = `${payload.error.message} Your draft was preserved.`;
              if (Array.isArray(payload.error.issues)) {
                const details = payload.error.issues
                  .filter(isRecord)
                  .map((issue) =>
                    [
                      typeof issue.tokenId === "string" ? issue.tokenId : undefined,
                      typeof issue.field === "string" ? issue.field : undefined,
                      typeof issue.message === "string" ? issue.message : undefined,
                    ]
                      .filter(Boolean)
                      .join(": "),
                  )
                  .filter(Boolean);
                if (details.length) message += ` ${details.join("; ")}`;
              }
            }
          } catch (error) {
            console.warn("Could not read save error response.", error);
          }
          if (response.status === 408 || response.status >= 500) {
            setOutcomeUnknown(true);
            message += " The save outcome is unknown; reload before applying again.";
          }
          setSaveError(message);
          return response;
        }
        const payload: unknown = await response.clone().json();
        const result = parseSavedRows(payload, request, models.baseModel);
        reconcileSavedRows(
          models.baseModel,
          models.draftModel,
          models.draftModel,
          projectId,
          result,
        );
        setModels((current) =>
          reconcileSavedRows(
            current.baseModel,
            current.draftModel,
            models.draftModel,
            projectId,
            result,
          ),
        );
        return response;
      } catch (error) {
        console.error("Save request or response failed.", error);
        setOutcomeUnknown(true);
        setSaveError(
          "Save outcome is unknown. Your draft was preserved; reload before applying again.",
        );
        return new Response("Save outcome is unknown.", { status: 503 });
      } finally {
        setIsApplying(false);
        setCompletion((current) => current + 1);
      }
    },
    [canApply, models, outcomeUnknown, projectId, setModels],
  );

  const applyDraft = useCallback(() => apply(), [apply]);
  const applyRow = useCallback((rowId: string) => apply(rowId), [apply]);
  return {
    updateRow,
    discardRow,
    resetDraft,
    applyDraft,
    applyRow,
    isApplying,
    saveError,
    outcomeUnknown,
  };
}
