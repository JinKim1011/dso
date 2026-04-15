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
