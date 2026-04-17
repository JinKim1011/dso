import { isSupportedKind, toId } from "./guards";
import { extractRows, normalizeEntry } from "./normalize";
import {
  type CategoryModel,
  DEFAULT_CATEGORY_ORDER,
  type ManifestAdapterOptions,
  type ManifestAdapterResult,
  type NormalizedManifestEntry,
  type SupportedKind,
  type TokenTypeModel,
  type TokenTypeValueItem,
} from "./types";

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

type SupportedEntry = Omit<NormalizedManifestEntry, "kind"> & { kind: SupportedKind };

function mapEntry(
  normalized: NormalizedManifestEntry,
  mapper?: ManifestAdapterOptions["mapper"],
): NormalizedManifestEntry {
  return {
    ...normalized,
    category: mapper?.mapCategory?.(normalized.category) ?? normalized.category,
    kind: mapper?.mapKind?.(normalized.kind) ?? normalized.kind,
  };
}

function isSupportedEntry(
  entry: NormalizedManifestEntry,
  mapper?: ManifestAdapterOptions["mapper"],
): entry is SupportedEntry {
  if (mapper?.includeEntry && !mapper.includeEntry(entry)) return false;
  return isSupportedKind(entry.kind);
}

function createTokenType(entry: SupportedEntry): TokenTypeModel {
  const tokenTypeId = toId("token-type", `${entry.category}-${entry.type}-${entry.kind}`);

  return {
    id: tokenTypeId,
    category: entry.category,
    type: entry.type,
    kind: entry.kind,
    values: createValueItems(entry, tokenTypeId),
  };
}

function addCategoryLink(
  categoriesByName: Map<string, CategoryModel>,
  categoryName: string,
  tokenTypeId: string,
): void {
  if (!categoriesByName.has(categoryName)) {
    categoriesByName.set(categoryName, {
      id: toId("category", categoryName),
      category: categoryName,
      tokenTypeIds: [],
    });
  }

  categoriesByName.get(categoryName)?.tokenTypeIds.push(tokenTypeId);
}

export function buildTokenGraphModel(
  manifestInput: unknown,
  options: ManifestAdapterOptions = {},
): ManifestAdapterResult {
  const mapper = options.mapper;
  const categoryOrder = options.categoryOrder ?? DEFAULT_CATEGORY_ORDER;
  const schemaVersion = options.schemaVersion ?? DEFAULT_SCHEMA_VERSION;

  const rows = extractRows(manifestInput);
  const tokenTypes: TokenTypeModel[] = [];
  const categoriesByName = new Map<string, CategoryModel>();
  let skippedCount = 0;

  for (const row of rows) {
    const normalized = normalizeEntry(row);

    if (!normalized) {
      skippedCount += 1;
      continue;
    }

    const entry = mapEntry(normalized, mapper);

    if (!isSupportedEntry(entry, mapper)) {
      skippedCount += 1;
      continue;
    }

    const tokenType = createTokenType(entry);

    tokenTypes.push(tokenType);
    addCategoryLink(categoriesByName, entry.category, tokenType.id);
  }

  tokenTypes.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.kind.localeCompare(b.kind);
  });

  const orderedCategories = sortCategoriesByOrder(
    [...categoriesByName.keys()],
    categoryOrder,
  );

  const categories = orderedCategories
    .map((categoryName) => categoriesByName.get(categoryName))
    .filter((category): category is CategoryModel => Boolean(category))
    .map((category) => ({
      ...category,
      tokenTypeIds: [...category.tokenTypeIds].sort(),
    }));

  return {
    model: {
      schemaVersion,
      root: {
        id: "root",
        label: "Design Tokens",
      },
      categories,
      tokenTypes,
    },
    skippedCount,
  };
}
