import type {
  TokenGraphViewModel,
  TokenTypeValueItem,
} from "@/_shared/models/tokenGraph";

export const DEFAULT_CATEGORY_ORDER = [
  "typography",
  "spacing",
  "color",
  "motion",
  "radius",
  "shadow",
] as const;

export const SUPPORTED_KINDS = ["primitive", "semantic"] as const;

export type SupportedKind = (typeof SUPPORTED_KINDS)[number];

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

export type ManifestViewModelResult = {
  viewModel: TokenGraphViewModel;
  skippedCount: number;
};

type ManifestMapper = {
  mapCategory?: (category: string) => string;
  mapKind?: (kind: string) => string;
  includeEntry?: (entry: NormalizedManifestEntry) => boolean;
};

export type ManifestAdapterOptions = {
  categoryOrder?: readonly string[];
  mapper?: ManifestMapper;
  schemaVersion?: number;
};
