"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildManifestFromGraph,
  TokenGraphModel,
} from "../../tokens/lib/manifestAdapter";
import {
  clearPersistedDraftModel,
  loadPersistedDraftModel,
  persistDraftModel,
} from "./stagedDraftStorage";
import {
  buildChangedRows,
  findRowById,
  getManifestLineChangeStats,
  replaceRowInModel,
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

  const updateRow = (rowId: string, update: Partial<any>) => {
    setDraftModel((current) => ({
      ...current,
      tokenTypes: current.tokenTypes.map((tokenType) => ({
        ...tokenType,
        values: tokenType.values.map((value) =>
          value.id === rowId ? { ...value, ...update } : value,
        ),
      })),
    }));
  };

  const resetDraft = () => {
    setDraftModel(baseModel);
  };

  const applyDraft = async (): Promise<Response> => {
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
  };

  const changedRows = useMemo(
    () => buildChangedRows(baseModel, draftModel),
    [baseModel, draftModel],
  );

  const manifestLineChangeStats = useMemo(
    () => getManifestLineChangeStats(baseModel, draftModel),
    [baseModel, draftModel],
  );

  const { addedLines, deletedLines } = manifestLineChangeStats;

  const discardRow = (rowId: string) => {
    const baseRow = findRowById(baseModel, rowId);
    if (!baseRow) return;

    setDraftModel((current) => replaceRowInModel(current, rowId, baseRow));
  };

  const applyRow = async (rowId: string): Promise<Response> => {
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
  };

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
