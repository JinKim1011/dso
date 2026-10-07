import { SUPPORTED_KINDS, type SupportedViewKind } from "@/_shared/models/tokenKinds";

type ObjectLike = Record<string, unknown>;

export function isObjectLike(value: unknown): value is ObjectLike {
  return typeof value === "object" && value !== null;
}

export function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length ? normalized : undefined;
}

export function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const normalized = value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item));

  return normalized.length ? normalized : undefined;
}

export function isSupportedKind(kind: string): kind is SupportedViewKind {
  return SUPPORTED_KINDS.includes(kind as SupportedViewKind);
}

export function toId(prefix: string, value: string): string {
  return `${prefix}:${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}
