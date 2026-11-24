import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { TokensJsonRenderError } from "@repo/generator/errors";
import {
  GENERATED_TOKEN_SCHEMA_VERSION,
  type GeneratedModeTokenValue,
  type GeneratedToken,
  type GeneratedTokenDocument,
  type GeneratedTokenValue,
  type GeneratedTypographyTokenValue,
} from "@repo/generator/types";

function compareTokenIds(left: GeneratedToken, right: GeneratedToken): number {
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function normalizeModeValue(value: GeneratedModeTokenValue): GeneratedModeTokenValue {
  return {
    kind: "modes",
    ...(value.light === undefined ? {} : { light: value.light }),
    ...(value.dark === undefined ? {} : { dark: value.dark }),
  };
}

function normalizeTypographyValue(
  value: GeneratedTypographyTokenValue,
): GeneratedTypographyTokenValue {
  return {
    kind: "typography",
    ...(value.fontSize === undefined ? {} : { fontSize: value.fontSize }),
    ...(value.fontWeight === undefined ? {} : { fontWeight: value.fontWeight }),
    ...(value.lineHeight === undefined ? {} : { lineHeight: value.lineHeight }),
  };
}

function normalizeValue(value: GeneratedTokenValue): GeneratedTokenValue {
  switch (value.kind) {
    case "single":
      return {
        kind: "single",
        value: value.value,
      };

    case "modes":
      return normalizeModeValue(value);

    case "typography":
      return normalizeTypographyValue(value);
  }
}

function normalizeToken(token: GeneratedToken): GeneratedToken {
  return {
    id: token.id,
    name: token.name,
    cssVar: token.cssVar,
    category: token.category,
    type: token.type,
    kind: token.kind,
    value: normalizeValue(token.value),
  };
}

export function renderTokensJson(
  release: PublishedReleaseResponse,
  resolvedTokens: readonly GeneratedToken[],
): string {
  if (release.release.publishedAt === null) {
    throw new TokensJsonRenderError("A published release must have a publishedAt.");
  }

  const document: GeneratedTokenDocument = {
    schemaVersion: GENERATED_TOKEN_SCHEMA_VERSION,
    release: {
      id: release.release.id,
      version: release.release.version,
      publishedAt: release.release.publishedAt,
    },
    tokens: [...resolvedTokens].sort(compareTokenIds).map(normalizeToken),
  };

  return `${JSON.stringify(document, null, 2)}\n`;
}
