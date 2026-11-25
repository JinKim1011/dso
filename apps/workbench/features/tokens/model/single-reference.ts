import type { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";

export type SingleReferenceCategory = Extract<
  TokenCategory,
  "spacing" | "radius" | "motion"
>;

const singleReferenceCategories = new Set<TokenCategory>(["spacing", "radius", "motion"]);

export function isSingleReferenceCategory(
  category: string,
): category is SingleReferenceCategory {
  return singleReferenceCategories.has(category as TokenCategory);
}

export function isSemanticSingleReference(
  category: string,
  kind: TokenKind,
): boolean {
  return kind === "semantic" && isSingleReferenceCategory(category);
}
