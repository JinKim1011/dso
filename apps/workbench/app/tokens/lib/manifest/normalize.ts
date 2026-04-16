import { asString, asStringArray, isObjectLike } from "./guards";
import {
  ManifestSemanticRecord,
  ManifestTokenRecord,
  NormalizedManifestEntry,
} from "./types";

export function extractRows(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (isObjectLike(input) && Array.isArray(input.entries)) {
    return input.entries;
  }

  return [];
}

export function normalizeTokenRecord(raw: unknown): ManifestTokenRecord | null {
  if (!isObjectLike(raw)) return null;

  const name = asString(raw.name);
  if (!name) return null;

  const cssVar = asString(raw.cssVar);
  const value = asString(raw.value);
  const statusRaw = raw.status;

  let status: ManifestTokenRecord["status"];

  if (typeof statusRaw === "string") {
    status = statusRaw;
  } else if (isObjectLike(statusRaw)) {
    status = {
      light: asString(statusRaw.light),
      dark: asString(statusRaw.dark),
    };
  }

  const valuesRaw = raw.values;
  let values: ManifestTokenRecord["values"];

  if (isObjectLike(valuesRaw)) {
    values = {
      light: asString(valuesRaw.light),
      dark: asString(valuesRaw.dark),
    };
  }

  return {
    name,
    cssVar,
    value,
    status,
    values,
  };
}

export function normalizeSemanticRecord(raw: unknown): ManifestSemanticRecord | null {
  if (!isObjectLike(raw)) return null;

  const name = asString(raw.name);
  const fontSize = asString(raw.fontSize);
  const fontWeight = asString(raw.fontWeight);
  const lineHeight = asString(raw.lineHeight);

  if (!name || !fontSize || !fontWeight || !lineHeight) return null;

  return {
    name,
    fontSize,
    fontWeight,
    lineHeight,
  };
}

export function normalizeEntry(raw: unknown): NormalizedManifestEntry | null {
  if (!isObjectLike(raw)) return null;

  const category = asString(raw.category);
  const type = asString(raw.type);
  const kind = asString(raw.kind);
  const value = asStringArray(raw.value);

  if (!category || !type || !kind || !value) return null;

  const tokens = Array.isArray(raw.tokens)
    ? raw.tokens
        .map((entry) => normalizeTokenRecord(entry))
        .filter((entry): entry is ManifestTokenRecord => entry !== null)
    : undefined;

  const semanticMap = Array.isArray(raw.semanticMap)
    ? raw.semanticMap
        .map((entry) => normalizeSemanticRecord(entry))
        .filter((entry): entry is ManifestSemanticRecord => entry !== null)
    : undefined;

  return {
    category,
    type,
    kind,
    value,
    tokens,
    semanticMap,
  };
}
