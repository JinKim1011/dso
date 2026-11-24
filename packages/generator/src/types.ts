import type { TokenCategory, TokenKind } from "@repo/contracts/validation/enum";

export const GENERATED_TOKEN_SCHEMA_VERSION = 1 as const;

export const GENERATED_TOKEN_FILE_NAMES = {
  json: "tokens.json",
  css: "tokens.css",
} as const;

export type GeneratedReleaseMetadata = {
  id: string;
  version: string;
  publishedAt: string;
};

export type GeneratedSingleTokenValue = {
  kind: "single";
  value: string;
};

export type GeneratedModeTokenValue = {
  kind: "modes";
  light?: string;
  dark?: string;
};

export type GeneratedTypographyTokenValue = {
  kind: "typography";
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
};

export type GeneratedTokenValue =
  GeneratedSingleTokenValue | GeneratedModeTokenValue | GeneratedTypographyTokenValue;

export type GeneratedToken = {
  id: string;
  name: string;
  cssVar: string | null;
  category: TokenCategory;
  type: string;
  kind: TokenKind;
  value: GeneratedTokenValue;
};

export type GeneratedTokenDocument = {
  schemaVersion: typeof GENERATED_TOKEN_SCHEMA_VERSION;
  release: GeneratedReleaseMetadata;
  tokens: GeneratedToken[];
};
