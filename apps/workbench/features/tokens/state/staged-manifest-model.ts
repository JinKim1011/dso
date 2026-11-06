import { buildManifestFromGraph } from "@/features/tokens/adapters/manifest/to-manifest";
import type {
  TokenGraphViewModel,
  TokenValue,
} from "@/features/tokens/model/token-graph";
import { diffLines } from "diff";

export type ChangedRow = {
  rowId: string;
  nameBefore: string;
  nameAfter: string;
  category: string;
  kind: string;
  tokenType: string;
  before: TokenValue;
  after: TokenValue;
};

type ManifestLineChangeStats = {
  addedLines: number;
  deletedLines: number;
};

function buildRowIndex(model: TokenGraphViewModel) {
  const index = new Map<string, { category: string; kind: string; value: TokenValue }>();

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

function isRowChanged(baseRow: TokenValue, draftRow: TokenValue): boolean {
  if (!baseRow) return true;

  return JSON.stringify(baseRow) !== JSON.stringify(draftRow);
}

export function buildChangedRows(
  baseModel: TokenGraphViewModel,
  draftModel: TokenGraphViewModel,
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

export function findRowById(
  model: TokenGraphViewModel,
  rowId: string,
): TokenValue | undefined {
  for (const tokenType of model.tokenTypes) {
    const found = tokenType.values.find((value) => value.id === rowId);

    if (found) return found;
  }

  return undefined;
}

export function replaceRowInModel(
  model: TokenGraphViewModel,
  rowId: string,
  replacement: TokenValue,
): TokenGraphViewModel {
  return {
    ...model,
    tokenTypes: model.tokenTypes.map((tokenType) => ({
      ...tokenType,
      values: tokenType.values.map((value) => (value.id === rowId ? replacement : value)),
    })),
  };
}

export function getManifestLineChangeStats(
  baseModel: TokenGraphViewModel,
  draftModel: TokenGraphViewModel,
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
