import {
  resolveModes,
  resolveTypography,
  type SlotContext,
} from "@/features/tokens/model/token-display-reference";
import type {
  TokenGraphViewModel,
  TokenTypeViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";

type ResolverRows = {
  baseRows: Map<string, TokenValueViewModel>;
  draftRows: SlotContext["draftRows"];
};

type TokenDisplay = {
  value: TokenValueViewModel;
  missingReference: boolean;
  incomplete: boolean;
};

export type TokenDisplayResolver = (
  row: TokenValueViewModel,
  type: Pick<TokenTypeViewModel, "category" | "kind">,
  previousRow?: TokenValueViewModel,
) => TokenDisplay;

function resolveTokenDisplay(
  rows: ResolverRows,
  row: TokenValueViewModel,
  type: Pick<TokenTypeViewModel, "category" | "kind">,
  previousRow?: TokenValueViewModel,
): TokenDisplay {
  const context: SlotContext = {
    row,
    baseRow: rows.baseRows.get(row.id),
    previousRow,
    category: type.category,
    draftRows: rows.draftRows,
  };

  switch (row.value.kind) {
    case "single":
      return {
        value: {
          ...row,
          meta: row.value.value,
          preview:
            type.category === "color"
              ? { kind: "single", value: row.value.value }
              : undefined,
        },
        missingReference: false,
        incomplete: false,
      };
    case "modes": {
      const { meta, preview, incomplete, missing } = resolveModes(context, row.value);

      return {
        value: {
          ...row,
          meta,
          preview,
        },
        missingReference: missing,
        incomplete,
      };
    }
    case "typography": {
      const { meta, preview, incomplete, missing } = resolveTypography(
        context,
        row.value,
      );

      return {
        value: { ...row, meta, preview },
        missingReference: missing,
        incomplete,
      };
    }
    case "unresolved":
      return {
        value: { ...row, meta: "unresolved", preview: undefined },
        missingReference: false,
        incomplete: true,
      };
  }
}

export function createTokenDisplayResolver(
  baseModel: TokenGraphViewModel,
  draftModel: TokenGraphViewModel,
): TokenDisplayResolver {
  const baseRows = new Map(
    baseModel.tokenTypes.flatMap((type) =>
      type.values.map((row) => [row.id, row] as const),
    ),
  );
  const draftRows = new Map(
    draftModel.tokenTypes.flatMap((type) =>
      type.values.map((row) => [row.id, { row, type }] as const),
    ),
  );

  const rows = { baseRows, draftRows };

  return (row, type, previousRow) => resolveTokenDisplay(rows, row, type, previousRow);
}

export function buildTokenDisplayModel(
  model: TokenGraphViewModel,
  resolve: TokenDisplayResolver,
): TokenGraphViewModel {
  return {
    ...model,
    tokenTypes: model.tokenTypes.map((type) => ({
      ...type,
      values: type.values.map((row) => resolve(row, type).value),
    })),
  };
}
