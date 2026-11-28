"use client";

import type { ChangedRow } from "@/features/tokens/model/staged/staged-change";
import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";
import type { TokenRowUpdate } from "@/features/tokens/model/token-row";
import {
  clearPersistedDraftModel,
  clearPersistedPendingPublish,
  discardLegacyDraft,
  loadPersistedDraftModel,
  loadPersistedPendingPublish,
  persistDraftModel,
  type PersistedPendingPublish,
} from "@/features/tokens/state/staged-draft-storage";
import { buildChangedRows } from "@/features/tokens/state/staged-graph-model";
import { useStagedActions } from "@/features/tokens/state/use-staged-actions";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type StagedContextType = {
  baseModel: TokenGraphViewModel;
  draftModel: TokenGraphViewModel;
  changedRows: ChangedRow[];
  changedRowCount: number;
  isStaleDraft: boolean;
  draftLoadError: boolean;
  canApply: boolean;
  isApplying: boolean;
  saveError: string | null;
  outcomeUnknown: boolean;
  updateRow: (rowId: string, update: TokenRowUpdate) => void;
  resetDraft: () => void;
  applyDraft: () => Promise<Response>;
  discardRow: (rowId: string) => void;
};

const StagedContext = createContext<StagedContextType | undefined>(undefined);

export function StagedContextProvider({
  projectId,
  baseManifest,
  children,
}: {
  projectId: string;
  baseManifest: TokenGraphViewModel;
  children: ReactNode;
}) {
  const [models, setModels] = useState({
    baseModel: baseManifest,
    draftModel: baseManifest,
  });
  const { baseModel, draftModel } = models;
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [isStaleDraft, setIsStaleDraft] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const [restoredPendingPublish, setRestoredPendingPublish] =
    useState<PersistedPendingPublish | null>(null);
  const resolveRestoredPendingPublish = useCallback(() => {
    setRestoredPendingPublish(null);
  }, []);

  const {
    updateRow,
    applyDraft,
    discardRow,
    resetDraft,
    isApplying,
    saveError,
    outcomeUnknown,
  } = useStagedActions({
    projectId,
    canApply:
      hasHydratedDraft &&
      (!isStaleDraft || restoredPendingPublish !== null) &&
      !draftLoadError,
    models,
    setModels,
    restoredPendingPublish,
    onPendingPublishResolved: resolveRestoredPendingPublish,
  });

  useEffect(() => {
    discardLegacyDraft();
    let pending: PersistedPendingPublish | null = null;

    try {
      pending = loadPersistedPendingPublish(projectId);
    } catch (error) {
      console.warn("Failed to restore pending publish.", error);

      clearPersistedPendingPublish(projectId);
    }

    try {
      const persistedDraft = loadPersistedDraftModel(projectId);
      if (persistedDraft) {
        setModels({
          baseModel: persistedDraft.baseModel,
          draftModel: persistedDraft.draftModel,
        });
        setIsStaleDraft(
          JSON.stringify(persistedDraft.baseModel) !== JSON.stringify(baseManifest),
        );
      } else if (pending) {
        setModels({
          baseModel: pending.submittedBaseModel,
          draftModel: pending.submittedDraftModel,
        });

        setIsStaleDraft(
          JSON.stringify(pending.submittedBaseModel) !== JSON.stringify(baseManifest),
        );
      }
    } catch (error) {
      console.warn("Failed to restore staged draft.", error);

      if (pending) {
        setModels({
          baseModel: pending.submittedBaseModel,
          draftModel: pending.submittedDraftModel,
        });

        setIsStaleDraft(
          JSON.stringify(pending.submittedBaseModel) !== JSON.stringify(baseManifest),
        );
      } else {
        setDraftLoadError(true);
      }
    }

    if (pending) setRestoredPendingPublish(pending);

    setHasHydratedDraft(true);
  }, [projectId, baseManifest]);

  useEffect(() => {
    if (!hasHydratedDraft || draftLoadError) return;

    const hasPendingChanges = buildChangedRows(baseModel, draftModel).length > 0;
    if (!hasPendingChanges && !isStaleDraft && !isApplying && !outcomeUnknown) {
      clearPersistedDraftModel(projectId);
      return;
    }

    persistDraftModel(projectId, baseModel, draftModel);
  }, [
    draftModel,
    hasHydratedDraft,
    baseModel,
    isStaleDraft,
    draftLoadError,
    projectId,
    isApplying,
    outcomeUnknown,
  ]);

  const changedRows = useMemo(
    () => buildChangedRows(baseModel, draftModel),
    [baseModel, draftModel],
  );

  const value = useMemo(
    () => ({
      baseModel,
      draftModel,
      changedRows,
      changedRowCount: changedRows.length,
      isStaleDraft,
      draftLoadError,
      canApply:
        hasHydratedDraft &&
        (!isStaleDraft || outcomeUnknown || restoredPendingPublish !== null) &&
        !draftLoadError,
      isApplying,
      saveError,
      outcomeUnknown,
      updateRow,
      resetDraft: () => {
        resetDraft();
        if (!outcomeUnknown && (isStaleDraft || draftLoadError)) {
          clearPersistedDraftModel(projectId);
          setModels({ baseModel: baseManifest, draftModel: baseManifest });
          setIsStaleDraft(false);
          setDraftLoadError(false);
        }
      },
      applyDraft,
      discardRow,
    }),
    [
      baseModel,
      draftModel,
      changedRows,
      isStaleDraft,
      draftLoadError,
      hasHydratedDraft,
      restoredPendingPublish,
      isApplying,
      saveError,
      outcomeUnknown,
      projectId,
      baseManifest,
      updateRow,
      resetDraft,
      applyDraft,
      discardRow,
    ],
  );

  return <StagedContext.Provider value={value}>{children}</StagedContext.Provider>;
}

export function useStagedContext() {
  const context = useContext(StagedContext);
  if (!context)
    throw new Error("useStagedContext must be used inside StagedContextProvider");
  return context;
}
