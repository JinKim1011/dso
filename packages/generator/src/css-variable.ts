import type { Token, TokenType } from "@repo/contracts/type";
import {
  deriveTokenCssVariable,
  findTokenCssVariableConflicts,
} from "@repo/contracts/validation/token-naming";
import { assertCssCustomPropertyName } from "@repo/generator/css-value";
import { TokensCssRenderError } from "@repo/generator/errors";

export function deriveCssVariable(
  token: Token,
  tokenType: TokenType,
  tokenTypesById: ReadonlyMap<string, TokenType>,
): string | null {
  const cssVar = deriveTokenCssVariable(token, tokenType, tokenTypesById);

  if (
    cssVar === null &&
    !(tokenType.kind === "semantic" && tokenType.category === "typography")
  ) {
    throw new TokensCssRenderError(
      "invalid-css-var",
      `Token "${token.id}" cannot produce a CSS variable name.`,
      token.id,
    );
  }
  if (cssVar === null) return null;

  assertCssCustomPropertyName(cssVar, token.id);

  return cssVar;
}

export function assertUniqueCssVariables(
  tokens: readonly Token[],
  tokenTypeById: ReadonlyMap<string, TokenType>,
): void {
  const conflicts = findTokenCssVariableConflicts(tokens, tokenTypeById);
  const conflict = conflicts.entries().next().value;

  if (conflict) {
    const [cssVar, tokenIds] = conflict;
    throw new TokensCssRenderError(
      "duplicate-css-var",
      `Tokens "${tokenIds[0]}" and "${tokenIds[1]}" produce the same CSS variable name "${cssVar}".`,
      tokenIds[1]!,
    );
  }
}
