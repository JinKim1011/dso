import { toId } from "@/features/tokens/adapters/manifest/guards";
import { normalizeManifest } from "@/features/tokens/adapters/manifest/normalize";
import type {
  ManifestAdapterOptions,
  ManifestTokenRecord,
  NormalizedManifestEntry,
} from "@/features/tokens/adapters/manifest/types";
import type {
  CategoryViewModel,
  TokenGraphViewModel,
  TokenTypeViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import type { Token } from "@repo/contracts/type";
import { isCategory, type TokenCategory } from "@repo/contracts/validation/enum";

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

function addCategoryLink(
  categoriesByName: Map<string, CategoryViewModel>,
  categoryName: TokenCategory,
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

function createValueItems(
  entry: NormalizedManifestEntry,
  tokenTypeId: string,
  category: TokenCategory,
): TokenValueViewModel[] {
  if (entry.tokens?.length) {
    return entry.tokens.map((token, index) => {
      const meta = token.value
        ? token.value
        : token.values
          ? `light:${token.values.light ?? "-"} dark:${token.values.dark ?? "-"}`
          : undefined;

      const value = toTokenValue(token);
      let preview: TokenValueViewModel["preview"] = undefined;
      if (value.kind === "single" && (category === "color" || category === "spacing")) {
        preview = {
          kind: "single",
          value: value.value,
        };
      } else if (value.kind === "modes" && (value.light || value.dark)) {
        preview = {
          kind: "modes",
          light: value.light,
          dark: value.dark,
        };
      }

      return {
        id: `${tokenTypeId}:value:${toId("name", token.name)}:${index}`,
        name: token.name,
        cssVar: token.cssVar,
        meta,
        preview,
        value,
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
      value: {
        kind: "typography",
        fontSize: semantic.fontSize,
        fontWeight: semantic.fontWeight,
        lineHeight: semantic.lineHeight,
      },
    }));
  }

  return entry.value.map((valueName, index) => ({
    id: `${tokenTypeId}:value:${toId("name", valueName)}:${index}`,
    name: valueName,
    value: { kind: "unresolved" },
  }));
}

function toTokenValue(token: ManifestTokenRecord): Token["value"] {
  if (token.values) {
    return {
      kind: "modes",
      light: token.values.light,
      dark: token.values.dark,
    };
  }

  if (token.value) {
    return {
      kind: "single",
      value: token.value,
    };
  }

  return { kind: "unresolved" };
}

function createTokenType(
  entry: NormalizedManifestEntry & { category: TokenCategory },
): TokenTypeViewModel {
  const tokenTypeId = toId("token-type", `${entry.category}-${entry.type}-${entry.kind}`);

  return {
    id: tokenTypeId,
    category: entry.category,
    type: entry.type,
    kind: entry.kind,
    values: createValueItems(entry, tokenTypeId, entry.category),
  };
}

function shouldIncludeEntry(
  entry: NormalizedManifestEntry,
  mapper?: ManifestAdapterOptions["mapper"],
): boolean {
  return mapper?.includeEntry?.(entry) ?? true;
}

function mapEntry(
  normalized: NormalizedManifestEntry,
  mapper?: ManifestAdapterOptions["mapper"],
): NormalizedManifestEntry & { category: TokenCategory } {
  const category = mapper?.mapCategory?.(normalized.category) ?? normalized.category;

  if (!isCategory(category)) {
    throw new Error(`Unsupported token category "${category}"`);
  }

  return {
    ...normalized,
    category,
  };
}

export function buildTokenGraphViewModel(
  manifestInput: unknown,
  options: ManifestAdapterOptions = {},
): ManifestViewModelResult {
  const mapper = options.mapper;
  const categoryOrder = options.categoryOrder ?? DEFAULT_CATEGORY_ORDER;
  const schemaVersion = options.schemaVersion ?? DEFAULT_SCHEMA_VERSION;

  const { entries, rejectedCount } = normalizeManifest(manifestInput);

  const tokenTypes: TokenTypeViewModel[] = [];
  const categoriesByName = new Map<string, CategoryViewModel>();
  let skippedCount = rejectedCount;

  for (const normalized of entries) {
    const entry = mapEntry(normalized, mapper);

    if (!shouldIncludeEntry(entry, mapper)) {
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
