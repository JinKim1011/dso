export const SUPPORTED_KINDS = ["primitive", "semantic"] as const;

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

export type ManifestAdapterOptions = {
  categoryOrder?: readonly string[];
  mapper?: ManifestMapper;
  schemaVersion?: number;
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
