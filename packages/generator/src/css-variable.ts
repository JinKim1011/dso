import type { Token, TokenType } from "@repo/contracts/type";
import { assertCssCustomPropertyName } from "@repo/generator/css-value";
import { TokensCssRenderError } from "@repo/generator/errors";

function normalizeCssName(value: string, tokenId: string): string {
  const normalized = value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");

  if (normalized.length === 0) {
    throw new TokensCssRenderError(
      "invalid-css-var",
      `Token "${tokenId}" cannot produce a CSS variable name.`,
      tokenId,
    );
  }

  return normalized;
}

function primitiveCssPrefix(tokenType: TokenType): string | null {
  if (tokenType.category === "typography") {
    switch (tokenType.name) {
      case "font-size":
        return "text";
      case "font-weight":
        return "font";
      case "line-height":
        return "leading";
      default:
        return null;
    }
  }

  return tokenType.category === "color" || tokenType.category === "shadow"
    ? "base"
    : null;
}

export function deriveCssVariable(token: Token, tokenType: TokenType): string | null {
  if (tokenType.kind === "semantic" && tokenType.category === "typography") {
    return null;
  }

  const normalizedName = normalizeCssName(token.name, token.id);
  const prefix =
    tokenType.kind === "semantic"
      ? normalizeCssName(tokenType.category, token.id)
      : primitiveCssPrefix(tokenType);

  const cssVar = `--${prefix ? `${prefix}-` : ""}${normalizedName}`;

  assertCssCustomPropertyName(cssVar, token.id);

  return cssVar;
}

export function assertUniqueCssVariables(
  tokens: readonly Token[],
  tokenTypeById: ReadonlyMap<string, TokenType>,
): void {
  const tokenIdByCssVar = new Map<string, string>();

  for (const token of tokens) {
    const tokenType = tokenTypeById.get(token.tokenTypeId);

    if (!tokenType) continue;

    const cssVar = deriveCssVariable(token, tokenType);

    if (cssVar === null) continue;

    const existingTokenId = tokenIdByCssVar.get(cssVar);

    if (existingTokenId !== undefined && existingTokenId !== token.id) {
      throw new TokensCssRenderError(
        "duplicate-css-var",
        `Tokens "${existingTokenId}" and "${token.id}" produce the same CSS variable name.`,
        token.id,
      );
    }

    tokenIdByCssVar.set(cssVar, token.id);
  }
}
