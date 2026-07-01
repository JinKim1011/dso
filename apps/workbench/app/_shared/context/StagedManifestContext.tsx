"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TokenGraphModel } from "../../tokens/lib/manifestAdapter";
import { useStagedManifestActions } from "../lib/useStagedManifestActions";
import { loadPersistedDraftModel, persistDraftModel } from "./stagedDraftStorage";
import {
  buildChangedRows,
  getManifestLineChangeStats,
  type ChangedRow,
} from "./stagedManifestModel";

type StagedContextType = {
  baseModel: TokenGraphModel;
  draftModel: TokenGraphModel;
  changedRows: ChangedRow[];
  changedRowCount: number;
  addedManifestLineCount: number;
  deletedManifestLineCount: number;
  updateRow: (rowId: string, update: Partial<any>) => void;
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
  baseManifest: TokenGraphModel;
  children: ReactNode;
}) {
  const [baseModel, setBaseModel] = useState<TokenGraphModel>(baseManifest);
  const [draftModel, setDraftModel] = useState<TokenGraphModel>(baseManifest);
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

    persistDraftModel(draftModel);
  }, [draftModel, hasHydratedDraft]);

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
    [baseModel, draftModel, changedRows, addedLines, deletedLines],
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
