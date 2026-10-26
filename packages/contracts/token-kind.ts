export const SUPPORTED_TOKEN_KINDS = ["primitive", "semantic"] as const;

export type SupportedTokenKind = (typeof SUPPORTED_TOKEN_KINDS)[number];

export function isSupportedTokenKind(value: unknown): value is SupportedTokenKind {
  return (
    typeof value === "string" &&
    SUPPORTED_TOKEN_KINDS.includes(value as SupportedTokenKind)
  );
}
