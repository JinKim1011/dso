"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { TokenGraphModel, TokenTypeValueItem } from "../../tokens/lib/manifestAdapter";

type ChangedRow = {
  rowId: string;
  nameBefore: string;
  nameAfter: string;
  category: string;
  kind: string;
  before: TokenTypeValueItem;
  after: TokenTypeValueItem;
};

type StagedContextType = {
  baseModel: TokenGraphModel;
  draftModel: TokenGraphModel;
  changedRows: ChangedRow[];
  updateRow: (rowId: string, update: Partial<any>) => void;
  resetDraft: () => void;
  applyDraft: () => Promise<Response>;
};

const StagedManifestContext = createContext<StagedContextType | undefined>(undefined);

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
        before: baseRow?.value ?? draftRow,
        after: draftRow,
      });
    }
  }
  return changedRows;
}

export function StagedManifestProvider({
  baseManifest,
  children,
}: {
  baseManifest: TokenGraphModel;
  children: ReactNode;
}) {
  const [baseModel, setBaseModel] = useState<TokenGraphModel>(baseManifest);
  const [draftModel, setDraftModel] = useState<TokenGraphModel>(baseManifest);

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
    const response = await fetch("/api/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest: draftModel }),
    });

    if (response.ok) {
      setBaseModel(draftModel);
    }

    return response;
  };

  const value = useMemo(
    () => ({ baseModel, draftModel, updateRow, resetDraft, applyDraft }),
    [baseModel, draftModel],
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
