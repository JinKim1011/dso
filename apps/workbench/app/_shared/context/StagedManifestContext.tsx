"use client";

import { diffLines } from "diff";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import {
  buildManifestFromGraph,
  TokenGraphModel,
  TokenTypeValueItem,
} from "../../tokens/lib/manifestAdapter";

type ChangedRow = {
  rowId: string;
  nameBefore: string;
  nameAfter: string;
  category: string;
  kind: string;
  tokenType: string;
  before: TokenTypeValueItem;
  after: TokenTypeValueItem;
};

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

const STAGED_DRAFT_STORAGE_VERSION = 1;
const STAGED_DRAFT_STORAGE_KEY = "dso-workbench-staged-draft";
type StagedDraftStoragePayload = {
  version: number;
  draftModel: TokenGraphModel;
};

const StagedManifestContext = createContext<StagedContextType | undefined>(undefined);

function loadPersistDraftModel(): TokenGraphModel | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STAGED_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StagedDraftStoragePayload>;

    if (parsed.version !== STAGED_DRAFT_STORAGE_VERSION) {
      return null;
    }

    if (!parsed.draftModel || typeof parsed.draftModel !== "object") {
      return null;
    }

    return parsed.draftModel as TokenGraphModel;
  } catch {
    return null;
  }
}

function buildRowIndex(model: TokenGraphModel) {
  const index = new Map<
    string,
    { category: string; kind: string; value: TokenTypeValueItem }
  >();

  for (const tokenType of model.tokenTypes) {
    for (const value of tokenType.values) {
      index.set(value.id, {
        category: tokenType.category,
        kind: tokenType.kind,
        value,
      });
    }
  }

  return index;
}

function isRowChanged(
  baseRow: TokenTypeValueItem,
  draftRow: TokenTypeValueItem,
): boolean {
  if (!baseRow) return true;

  return JSON.stringify(baseRow) !== JSON.stringify(draftRow);
}

function buildChangedRows(
  baseModel: TokenGraphModel,
  draftModel: TokenGraphModel,
): ChangedRow[] {
  const baseIndex = buildRowIndex(baseModel);
  const changedRows: ChangedRow[] = [];

  for (const tokenType of draftModel.tokenTypes) {
    for (const draftRow of tokenType.values) {
      const baseRow = baseIndex.get(draftRow.id);
      if (!baseRow) continue;

      if (!isRowChanged(baseRow?.value, draftRow)) {
        continue;
      }

      changedRows.push({
        rowId: draftRow.id,
        nameBefore: baseRow.value.name ?? "",
        nameAfter: draftRow.name,
        category: tokenType.category,
        kind: tokenType.kind,
        tokenType: tokenType.type,
        before: baseRow?.value ?? draftRow,
        after: draftRow,
      });
    }
  }
  return changedRows;
}

type ManifestLineChangeStats = {
  addedLines: number;
  deletedLines: number;
};

function getManifestLineChangeStats(
  baseModel: TokenGraphModel,
  draftModel: TokenGraphModel,
): ManifestLineChangeStats {
  const baseManifest = buildManifestFromGraph(baseModel);
  const draftManifest = buildManifestFromGraph(draftModel);

  const baseContent = JSON.stringify(baseManifest, null, 2);
  const draftContent = JSON.stringify(draftManifest, null, 2);

  const diff = diffLines(baseContent, draftContent);
  let addedLines = 0;
  let deletedLines = 0;

  for (const part of diff) {
    if (part.added) {
      addedLines += part.count ?? 0;
    }

    if (part.removed) {
      deletedLines += part.count ?? 0;
    }
  }

  return {
    addedLines,
    deletedLines,
  };
}

function findRowById(
  model: TokenGraphModel,
  rowId: string,
): TokenTypeValueItem | undefined {
  for (const tokenType of model.tokenTypes) {
    const found = tokenType.values.find((value) => value.id === rowId);

    if (found) return found;
  }

  return undefined;
}

function replaceRowInModel(
  model: TokenGraphModel,
  rowId: string,
  replacement: TokenTypeValueItem,
): TokenGraphModel {
  return {
    ...model,
    tokenTypes: model.tokenTypes.map((tokenType) => ({
      ...tokenType,
      values: tokenType.values.map((value) => (value.id === rowId ? replacement : value)),
    })),
  };
}

export function StagedManifestProvider({
  baseManifest,
  children,
}: {
  baseManifest: TokenGraphModel;
  children: ReactNode;
}) {
  const [baseModel, setBaseModel] = useState<TokenGraphModel>(baseManifest);
  const [draftModel, setDraftModel] = useState<TokenGraphModel>(
    () => loadPersistDraftModel() ?? baseManifest,
  );

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
