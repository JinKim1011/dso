import type {
  CategoryViewModel,
  TokenGraphViewModel,
  TokenTypeValueItem,
  TokenTypeViewModel,
} from "@/_shared/models/tokenGraph";
import type { SupportedViewKind } from "@/_shared/models/tokenKinds";
import type {
  ManifestAdapterOptions,
  NormalizedManifestEntry,
} from "@/tokens/lib/manifest/types";
import { isSupportedKind, toId } from "./guards";
import { extractRows, normalizeEntry } from "./normalize";

type ManifestViewModelResult = {
  viewModel: TokenGraphViewModel;
  skippedCount: number;
};

const DEFAULT_SCHEMA_VERSION = 1;

export const DEFAULT_CATEGORY_ORDER = [
  "typography",
  "spacing",
  "color",
  "motion",
  "radius",
  "shadow",
] as const;

function createValueItems(
  entry: SupportedEntry,
  tokenTypeId: string,
  category: string,
): TokenTypeValueItem[] {
  if (entry.tokens?.length) {
    return entry.tokens.map((token, index) => {
      let status: string | undefined;

      if (typeof token.status === "string") {
        status = token.status;
      } else if (token.status) {
        status =
          [token.status.light, token.status.dark].filter(Boolean).join("/") || undefined;
      }

      const meta = token.value
        ? token.value
        : token.values
          ? `light:${token.values.light ?? "-"} dark:${token.values.dark ?? "-"}`
          : undefined;

      let preview: TokenTypeValueItem["preview"] = undefined;
      if (category === "color" && token.values) {
        preview = {
          kind: "color",
          light: token.values.light,
          dark: token.values.dark,
        };
      } else if (category === "spacing" && token.value) {
        preview = {
          kind: "spacing",
          value: token.value,
        };
      }

      return {
        id: `${tokenTypeId}:value:${toId("name", token.name)}:${index}`,
        name: token.name,
        cssVar: token.cssVar,
        status,
        meta,
        preview,
        category,
        kind: entry.kind,
        value: token.values ?? token.value,
      };
    });
  }

  if (entry.semanticMap?.length) {
    return entry.semanticMap.map((semantic, index) => ({
      id: `${tokenTypeId}:value:${toId("name", semantic.name)}:${index}`,
      name: semantic.name,
      meta: `${semantic.fontSize} / ${semantic.fontWeight} / ${semantic.lineHeight}`,
      preview: {
        kind: "typography",
        typography: {
          fontSize: semantic.fontSize,
          fontWeight: semantic.fontWeight,
          lineHeight: semantic.lineHeight,
        },
      },
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

type SupportedEntry = Omit<NormalizedManifestEntry, "kind"> & { kind: SupportedViewKind };

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

function createTokenType(entry: SupportedEntry): TokenTypeViewModel {
  const tokenTypeId = toId("token-type", `${entry.category}-${entry.type}-${entry.kind}`);

  return {
    id: tokenTypeId,
    category: entry.category,
    type: entry.type,
    kind: entry.kind,
    values: createValueItems(entry, tokenTypeId, entry.category),
  };
}

function addCategoryLink(
  categoriesByName: Map<string, CategoryViewModel>,
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

export function buildTokenGraphViewModel(
  manifestInput: unknown,
  options: ManifestAdapterOptions = {},
): ManifestViewModelResult {
  const mapper = options.mapper;
  const categoryOrder = options.categoryOrder ?? DEFAULT_CATEGORY_ORDER;
  const schemaVersion = options.schemaVersion ?? DEFAULT_SCHEMA_VERSION;

  const rows = extractRows(manifestInput);

  const normalizedEntries = rows
    .map(normalizeEntry)
    .filter((entry): entry is NormalizedManifestEntry => entry !== null);

  const tokenTypes: TokenTypeViewModel[] = [];
  const categoriesByName = new Map<string, CategoryViewModel>();
  let skippedCount = 0;

  for (const row of normalizedEntries) {
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
    .filter((category): category is CategoryViewModel => Boolean(category))
    .map((category) => ({
      ...category,
      tokenTypeIds: [...category.tokenTypeIds].sort(),
    }));

  return {
    viewModel: {
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

export function buildManifestFromGraph(
  model: TokenGraphViewModel,
): NormalizedManifestEntry[] {
  const entries: NormalizedManifestEntry[] = [];

  for (const tokenType of model.tokenTypes) {
    entries.push({
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      value: tokenType.values.map((value) => value.value as string),
      tokens: tokenType.values.map((value) => ({
        name: value.name,
        cssVar: value.cssVar,
        value: value.value as string,
        status: value.status,
      })),
    });
  }

  return entries;
}
