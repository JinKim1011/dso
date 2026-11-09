import type { Token } from "@repo/contracts/type";

export function groupTokensByType(tokens: Token[]): Map<string, Token[]> {
  const tokensByType = new Map<string, Token[]>();

  for (const token of tokens) {
    const current = tokensByType.get(token.tokenTypeId) ?? [];
    current.push(token);
    tokensByType.set(token.tokenTypeId, current);
  }

  return tokensByType;
}
