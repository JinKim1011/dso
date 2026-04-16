export const DEFAULT_CATEGORY_ORDER = [
  "typography",
  "spacing",
  "color",
  "motion",
  "radius",
  "shadow",
] as const;

export const SUPPORTED_KINDS = ["primitive", "semantic"] as const;
// limit v1 to primitive and semantic, excluding class-union kind
export type SupportedKind = (typeof SUPPORTED_KINDS)[number];

// input type group
export type ManifestTokenRecord = {
  name: string;
  cssVar?: string;
  value?: string;
  values?: {
    light?: string;
    dark?: string;
  };
  status?: string | { light?: string; dark?: string };
};

export type ManifestSemanticRecord = {
  name: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
};

export type NormalizedManifestEntry = {
  category: string;
  type: string;
  kind: string;
  value: string[];
  tokens?: ManifestTokenRecord[];
  semanticMap?: ManifestSemanticRecord[];
};

// output type group
export type TokenTypeValueItem = {
  id: string;
  name: string;
  cssVar?: string;
  status?: string;
  meta?: string;
};

export type CategoryModel = {
  id: string;
  category: string;
  tokenTypeIds: string[];
};

export type TokenTypeModel = {
  id: string;
  category: string;
  type: string;
  kind: SupportedKind;
  values: TokenTypeValueItem[];
};

export type TokenGraphModel = {
  schemaVersion: number;
  root: {
    id: "root";
    label: "Design Tokens";
  };
  categories: CategoryModel[];
  tokenTypes: TokenTypeModel[];
};

// Diagonstics type group
export type ManifestAdapterWarning = {
  code:
    | "invalid-entry"
    | "missing-required"
    | "invalid-value"
    | "unsupported-kind"
    | "invalid-container";
  message: string;
  index?: number;
};

export type ManifestAdapterResult = {
  model: TokenGraphModel;
  warnings: ManifestAdapterWarning[];
  skippedCount: number;
};

// Extensibility type group
export type ManifestMapper = {
  mapCategory?: (category: string) => string;
  mapKind?: (kind: string) => string;
  includeEntry?: (entry: NormalizedManifestEntry) => boolean;
};

export type ManifestAdapterOptions = {
  categoryOrder?: readonly string[];
  mapper?: ManifestMapper;
  schemaVersion?: number;
};
