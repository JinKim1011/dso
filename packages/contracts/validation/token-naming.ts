import type { Token, TokenType } from "@repo/contracts/type";

export function normalizeTokenPathSegment(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");
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

export function tokenTypePath(
  tokenType: TokenType,
  tokenTypesById: ReadonlyMap<string, TokenType>,
): string[] {
  const path: string[] = [];
  const visited = new Set<string>();
  let current: TokenType | undefined = tokenType;

  while (
    current &&
    current.kind === "semantic" &&
    current.category === tokenType.category
  ) {
    if (visited.has(current.id)) {
      throw new Error(`Token type "${tokenType.id}" contains a parent cycle.`);
    }

    visited.add(current.id);
    path.unshift(current.name);

    if (current.parentTypeId === null) break;
    current = tokenTypesById.get(current.parentTypeId);
  }

  return path;
}

export function deriveTokenCssVariable(
  token: Token,
  tokenType: TokenType,
  tokenTypesById: ReadonlyMap<string, TokenType>,
): string | null {
  if (tokenType.kind === "semantic" && tokenType.category === "typography") {
    return null;
  }

  const normalizedName = normalizeTokenPathSegment(token.name);

  if (!normalizedName) return null;

  if (tokenType.kind === "primitive") {
    const prefix = primitiveCssPrefix(tokenType);
    return `--${prefix ? `${prefix}-` : ""}${normalizedName}`;
  }

  const category = normalizeTokenPathSegment(tokenType.category);
  const typePath = tokenTypePath(tokenType, tokenTypesById)
    .map(normalizeTokenPathSegment)
    .filter((segment) => segment && segment !== category);
  const normalizedTypePath = typePath.join("-");
  const nameIncludesPath =
    normalizedTypePath.length > 0 &&
    (normalizedName === normalizedTypePath ||
      normalizedName.startsWith(`${normalizedTypePath}-`));
  const suffix = nameIncludesPath
    ? normalizedName
    : [...typePath, normalizedName].join("-");

  return `--${[category, suffix].filter(Boolean).join("-")}`;
}

export function findTokenCssVariableConflicts(
  tokens: readonly Token[],
  tokenTypesById: ReadonlyMap<string, TokenType>,
): ReadonlyMap<string, readonly string[]> {
  const tokenIdsByCssVariable = new Map<string, string[]>();

  for (const token of tokens) {
    const tokenType = tokenTypesById.get(token.tokenTypeId);
    if (!tokenType) continue;

    const cssVariable = deriveTokenCssVariable(token, tokenType, tokenTypesById);
    if (cssVariable === null) continue;

    const ids = tokenIdsByCssVariable.get(cssVariable) ?? [];
    ids.push(token.id);
    tokenIdsByCssVariable.set(cssVariable, ids);
  }

  return new Map(
    [...tokenIdsByCssVariable].filter(([, tokenIds]) => tokenIds.length > 1),
  );
}
