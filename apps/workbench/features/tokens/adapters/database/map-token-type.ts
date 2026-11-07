import { mapTokenValue } from "@/features/tokens/adapters/database/map-token-value";
import type {
  TokenTypeViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import type { Token, TokenType } from "@repo/contracts/type";
import { isCategory, type TokenCategory } from "@repo/contracts/validation/enum";

export function mapTokenType(
  tokenType: TokenType,
  tokensByType: Map<string, Token[]>,
): TokenTypeViewModel {
  if (!isCategory(tokenType.category)) {
    throw new Error(
      `Unsupported token category "${tokenType.category}" ` +
        `for token type "${tokenType.id}".`,
    );
  }

  const category: TokenCategory = tokenType.category;
  const tokens = tokensByType.get(tokenType.id) ?? [];

  const values: TokenValueViewModel[] = tokens
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((token) => ({
      id: token.id,
      name: token.name,
      cssVar: token.cssVar ?? undefined,
      ...mapTokenValue(token, category),
    }));

  return {
    id: tokenType.id,
    category,
    type: tokenType.name,
    kind: tokenType.kind,
    values,
  };
}
