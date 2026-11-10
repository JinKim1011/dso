import type { ChangedRow } from "@/features/tokens/model/staged/staged-change";
import { buildStagedTokenChange } from "@/features/tokens/model/staged/staged-change-diff";
import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";

function buildRowIndex(model: TokenGraphViewModel) {
  const index = new Map<string, TokenValueViewModel>();

  for (const tokenType of model.tokenTypes) {
    for (const value of tokenType.values) {
      index.set(value.id, value);
    }
  }

  return index;
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

      // Whole-token additions are not supported by this flow yet.
      if (!baseRow) continue;

      const change = buildStagedTokenChange(baseRow, draftRow);

      if (!change) continue;

      changedRows.push({
        rowId: draftRow.id,
        nameBefore: baseRow.name,
        nameAfter: draftRow.name,
        category: tokenType.category,
        kind: tokenType.kind,
        tokenType: tokenType.type,
        before: baseRow,
        after: draftRow,
        change,
      });
    }
  }

  return changedRows;
}

export function findRowById(
  model: TokenGraphViewModel,
  rowId: string,
): TokenValueViewModel | undefined {
  for (const tokenType of model.tokenTypes) {
    const found = tokenType.values.find((value) => value.id === rowId);

    if (found) return found;
  }

  return undefined;
}

export function replaceRowInModel(
  model: TokenGraphViewModel,
  rowId: string,
  replacement: TokenValueViewModel,
): TokenGraphViewModel {
  return {
    ...model,
    tokenTypes: model.tokenTypes.map((tokenType) => ({
      ...tokenType,
      values: tokenType.values.map((value) => (value.id === rowId ? replacement : value)),
    })),
  };
}
