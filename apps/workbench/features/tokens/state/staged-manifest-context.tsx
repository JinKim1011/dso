"use client";

import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";
import type { TokenRowUpdate } from "@/features/tokens/model/token-row";
import {
  clearPersistedDraftModel,
  loadPersistedDraftModel,
  persistDraftModel,
} from "@/features/tokens/state/staged-draft-storage";
import {
  buildChangedRows,
  getManifestLineChangeStats,
  type ChangedRow,
} from "@/features/tokens/state/staged-manifest-model";
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
  baseManifest,
  children,
}: {
  baseManifest: TokenGraphViewModel;
  children: ReactNode;
}) {
  const [baseModel, setBaseModel] = useState<TokenGraphViewModel>(baseManifest);
  const [draftModel, setDraftModel] = useState<TokenGraphViewModel>(baseManifest);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);

  const { updateRow, applyDraft, discardRow, applyRow, resetDraft } =
    useStagedManifestActions({
      baseModel,
      draftModel,
      setBaseModel,
      setDraftModel,
    });

  useEffect(() => {
    const persistedDraft = loadPersistedDraftModel();
    if (persistedDraft) {
      setDraftModel(persistedDraft);
    }

    setHasHydratedDraft(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedDraft) return;

    const hasPendingChanges = buildChangedRows(baseModel, draftModel).length > 0;
    if (!hasPendingChanges) {
      clearPersistedDraftModel();
      return;
    }

    persistDraftModel(draftModel);
  }, [draftModel, hasHydratedDraft, baseModel]);

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
      addedManifestLineCount: addedLines,
      deletedManifestLineCount: deletedLines,
      updateRow,
      resetDraft,
      applyDraft,
      discardRow,
      applyRow,
    }),
    [
      baseModel,
      draftModel,
      changedRows,
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
