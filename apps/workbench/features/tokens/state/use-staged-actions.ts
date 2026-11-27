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
  parsePublishedRows,
  reconcileSavedRows,
} from "@/features/tokens/state/staged-save-result";
import type { PublishStagedChangesRequest } from "@repo/contracts/operation";
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

export function useStagedActions({
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
  const pendingPublish = useRef<{ requestBody: string; requestId: string } | null>(null);

  useLayoutEffect(() => {
    if (!isApplying) busy.current = false;
  }, [isApplying, completion]);

  const updateRow = useCallback(
    (rowId: string, update: Partial<TokenValueViewModel>) => {
      if (outcomeUnknown) return;
      setSaveError(null);

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
    [outcomeUnknown, setModels],
  );

  const discardRow = useCallback(
    (rowId: string) => {
      if (outcomeUnknown) return;
      setSaveError(null);

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
    [outcomeUnknown, setModels],
  );

  const resetDraft = useCallback(() => {
    if (outcomeUnknown) return;
    setSaveError(null);

    setModels((current) => ({ ...current, draftModel: current.baseModel }));
  }, [outcomeUnknown, setModels]);

  const applyDraft = useCallback(async (): Promise<Response> => {
    if (!canApply) {
      return new Response("Draft is not ready to push.", { status: 409 });
    }

    if (busy.current)
      return new Response("A push is already in progress.", { status: 409 });

    const rows = buildChangedRows(models.baseModel, models.draftModel);
    if (rows.length === 0) {
      const message = "No staged changes.";
      setSaveError(message);
      return new Response(message, { status: 400 });
    }

    const requestBase = {
      projectId,
      changes: rows.map((row) => row.change),
    };
    const requestBody = JSON.stringify(requestBase);
    const pending =
      pendingPublish.current?.requestBody === requestBody
        ? pendingPublish.current
        : { requestBody, requestId: crypto.randomUUID() };
    pendingPublish.current = pending;
    const request: PublishStagedChangesRequest = {
      requestId: pending.requestId,
      ...requestBase,
    };
    const body = JSON.stringify(request);

    if (
      rows.length > CONTRACT_LIMITS.collectionItems ||
      new TextEncoder().encode(body).byteLength > CONTRACT_LIMITS.requestBodyBytes
    ) {
      const message =
        "The staged batch exceeds the push limit. Reduce the number or size of staged changes before pushing.";
      setSaveError(message);
      return new Response(message, { status: 413 });
    }

    busy.current = true;
    setIsApplying(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/releases/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-DSO-CSRF": "1" },
        body,
      });
      if (!response.ok) {
        let message = `Push failed (${response.status}). Your draft was preserved.`;
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
          console.warn("Could not read push error response.", error);
        }
        if (response.status === 408 || response.status >= 500) {
          setOutcomeUnknown(true);
          message += " The push outcome is unknown. Retry without changing the draft.";
        }
        setSaveError(message);
        return response;
      }

      const payload: unknown = await response.clone().json();
      const result = parsePublishedRows(payload, request, models.baseModel);
      pendingPublish.current = null;
      setOutcomeUnknown(false);
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
      console.error("Push request or response failed.", error);
      setOutcomeUnknown(true);
      setSaveError(
        "Push outcome is unknown. Your draft was preserved. Retry without changing it.",
      );
      return new Response("Push outcome is unknown.", { status: 503 });
    } finally {
      setIsApplying(false);

      setCompletion((current) => current + 1);
    }
  }, [canApply, models, projectId, setModels]);

  return {
    updateRow,
    discardRow,
    resetDraft,
    applyDraft,
    isApplying,
    saveError,
    outcomeUnknown,
  };
}
