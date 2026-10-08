export const SUPPORTED_KINDS = ["primitive", "semantic"] as const;

export type SupportedViewKind = (typeof SUPPORTED_KINDS)[number];
