import type {
  CategoryViewModel,
  TokenTypeViewModel,
} from "@/features/tokens/model/token-graph";
import { TokenCategory } from "@repo/contracts/validation/enum";

export const CATEGORY_ORDER = [
  "color",
  "typography",
  "spacing",
  "radius",
  "shadow",
  "motion",
] as const;

function sortCategories(categories: CategoryViewModel[]): CategoryViewModel[] {
  const rank = new Map(CATEGORY_ORDER.map((category, index) => [category, index]));

  return [...categories].sort((a, b) => {
    const rankA = rank.get(a.category);
    const rankB = rank.get(b.category);

    if (rankA !== undefined && rankB !== undefined) {
      return rankA - rankB;
    }

    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;

    return a.category.localeCompare(b.category);
  });
}

export function buildCategories(tokenTypes: TokenTypeViewModel[]): CategoryViewModel[] {
  const categoryMap = new Map<TokenCategory, string[]>();

  for (const tokenType of tokenTypes) {
    const ids = categoryMap.get(tokenType.category) ?? [];
    ids.push(tokenType.id);
    categoryMap.set(tokenType.category, ids);
  }

  const categories: CategoryViewModel[] = [...categoryMap.entries()].map(
    ([category, tokenTypeIds]) => ({
      id: `category:${category}`,
      category,
      tokenTypeIds: [...tokenTypeIds].sort(),
    }),
  );

  return sortCategories(categories);
}
