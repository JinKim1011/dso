import { SUPPORTED_KINDS, SupportedKind } from "./types";

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

  return normalized;
}

export function isSupportedKind(kind: string): kind is SupportedKind {
  return (SUPPORTED_KINDS as readonly string[]).includes(kind);
}

export function toId(prefix: string, value: string): string {
  return `${prefix}:${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}
