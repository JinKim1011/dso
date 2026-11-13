"use client";

import type { ChangedRow } from "@/features/tokens/model/staged/staged-change";
import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";
import type { TokenRowUpdate } from "@/features/tokens/model/token-row";
import {
  clearPersistedDraftModel,
  discardLegacyDraft,
  loadPersistedDraftModel,
  persistDraftModel,
} from "@/features/tokens/state/staged-draft-storage";
import { buildChangedRows } from "@/features/tokens/state/staged-graph-model";
import { getManifestLineChangeStats } from "@/features/tokens/state/staged-manifest-model";
import { useStagedManifestActions } from "@/features/tokens/state/use-staged-manifest-actions";
import {
  createContext,
  ReactNode,
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
  addedManifestLineCount: number;
  deletedManifestLineCount: number;
  updateRow: (rowId: string, update: TokenRowUpdate) => void;
  resetDraft: () => void;
  applyDraft: () => Promise<Response>;
  discardRow: (rowId: string) => void;
  applyRow: (rowId: string) => Promise<Response>;
};

const StagedManifestContext = createContext<StagedContextType | undefined>(undefined);

export function StagedManifestProvider({
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

  const { updateRow, applyDraft, discardRow, applyRow, resetDraft } =
    useStagedManifestActions({
      canApply: hasHydratedDraft && !isStaleDraft && !draftLoadError,
      baseModel,
      draftModel,
      setDraftModel,
    });

  useEffect(() => {
    discardLegacyDraft();
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
      }
    } catch (error) {
      console.warn("Failed to restore staged draft.", error);
      setDraftLoadError(true);
    }

    setHasHydratedDraft(true);
  }, [projectId, baseManifest]);

  useEffect(() => {
    if (!hasHydratedDraft || draftLoadError) return;

    const hasPendingChanges = buildChangedRows(baseModel, draftModel).length > 0;
    if (!hasPendingChanges && !isStaleDraft) {
      clearPersistedDraftModel(projectId);
      return;
    }

    persistDraftModel(projectId, baseModel, draftModel);
  }, [draftModel, hasHydratedDraft, baseModel, isStaleDraft, draftLoadError, projectId]);

  const changedRows = useMemo(
    () => buildChangedRows(baseModel, draftModel),
    [baseModel, draftModel],
  );

  const manifestLineChangeStats = useMemo(
    () => getManifestLineChangeStats(baseModel, draftModel),
    [baseModel, draftModel],
  );

  const { addedLines, deletedLines } = manifestLineChangeStats;

  const value = useMemo(
    () => ({
      baseModel,
      draftModel,
      changedRows,
      changedRowCount: changedRows.length,
      isStaleDraft,
      draftLoadError,
      addedManifestLineCount: addedLines,
      deletedManifestLineCount: deletedLines,
      updateRow,
      resetDraft: () => {
        if (isStaleDraft || draftLoadError) {
          clearPersistedDraftModel(projectId);
          setModels({ baseModel: baseManifest, draftModel: baseManifest });
          setIsStaleDraft(false);
          setDraftLoadError(false);
        } else {
          resetDraft();
        }
      },
      applyDraft,
      discardRow,
      applyRow,
    }),
    [
      baseModel,
      draftModel,
      changedRows,
      isStaleDraft,
      draftLoadError,
      projectId,
      baseManifest,
      addedLines,
      deletedLines,
      updateRow,
      resetDraft,
      applyDraft,
      discardRow,
      applyRow,
    ],
  );

  return (
    <StagedManifestContext.Provider value={value}>
      {children}
    </StagedManifestContext.Provider>
  );
}

export function useStagedManifest() {
  const context = useContext(StagedManifestContext);
  if (!context)
    throw new Error("useStagedManifest must be used inside StagedManifestProvider");
  return context;
}
