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
): TokenDisplay {
  const context: SlotContext = {
    row,
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
      const { meta, preview, incomplete, missing } = resolveModes(context);

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
      const { meta, preview, incomplete, missing } = resolveTypography(context);

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
  draftModel: TokenGraphViewModel,
): TokenDisplayResolver {
  const draftRows = new Map(
    draftModel.tokenTypes.flatMap((type) =>
      type.values.map((row) => [row.id, { row, type }] as const),
    ),
  );

  const rows = { draftRows };

  return (row, type) => resolveTokenDisplay(rows, row, type);
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
