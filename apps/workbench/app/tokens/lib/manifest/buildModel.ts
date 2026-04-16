import { toId } from "./guards";
import { type NormalizedManifestEntry, type TokenTypeValueItem } from "./types";

const DEFAULT_SCHEMA_VERSION = 1;

function createValueItems(
  entry: NormalizedManifestEntry,
  tokenTypeId: string,
): TokenTypeValueItem[] {
  if (entry.tokens?.length) {
    return entry.tokens.map((token, index) => {
      const status =
        typeof token.status === "string"
          ? token.status
          : token.status
            ? [token.status.light, token.status.dark].filter(Boolean).join("/")
            : undefined;

      const meta = token.value
        ? token.value
        : token.values
          ? `light:${token.values.light ?? "-"} dark:${token.values.dark ?? "-"}`
          : undefined;

      return {
        id: `${tokenTypeId}:value:${toId("name", token.name)}:${index}`,
        name: token.name,
        cssVar: token.cssVar,
        status,
        meta,
      };
    });
  }

  if (entry.semanticMap?.length) {
    return entry.semanticMap.map((semantic, index) => ({
      id: `${tokenTypeId}:value:${toId("name", semantic.name)}:${index}`,
      name: semantic.name,
      meta: `${semantic.fontSize} / ${semantic.fontWeight} / ${semantic.lineHeight}`,
    }));
  }

  return entry.value.map((valueName, index) => ({
    id: `${tokenTypeId}:value:${toId("name", valueName)}:${index}`,
    name: valueName,
  }));
}

function sortCategoriesByOrder(
  categoryNames: string[],
  categoryOrder: readonly string[],
): string[] {
  const rank = new Map(categoryOrder.map((name, index) => [name, index]));

  return [...categoryNames].sort((a, b) => {
    const rankA = rank.get(a);
    const rankB = rank.get(b);

    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    return a.localeCompare(b);
  });
}
