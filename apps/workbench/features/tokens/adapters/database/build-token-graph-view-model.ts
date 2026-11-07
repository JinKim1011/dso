import { buildCategories } from "@/features/tokens/adapters/database/build-categories";
import { groupTokensByType } from "@/features/tokens/adapters/database/group-tokens-by-type";
import { mapTokenType } from "@/features/tokens/adapters/database/map-token-type";
import { TokenGraphViewModel } from "@/features/tokens/model/token-graph";
import { Token, TokenType } from "@repo/contracts/type";

const DEFAULT_SCHEMA_VERSION = 1;

export function buildTokenGraphViewModel(
  tokenTypes: TokenType[],
  tokens: Token[],
): TokenGraphViewModel {
  const tokensByType = groupTokensByType(tokens);

  const mappedTokenTypes = [...tokenTypes]
    .sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }

      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }

      return a.kind.localeCompare(b.kind);
    })
    .map((tokenType) => mapTokenType(tokenType, tokensByType));

  return {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    root: {
      id: "root",
      label: "Design Tokens",
    },
    categories: buildCategories(mappedTokenTypes),
    tokenTypes: mappedTokenTypes,
  };
}
