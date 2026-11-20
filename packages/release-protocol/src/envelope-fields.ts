import type { ReleaseSignature } from "@repo/contracts/operation";
import type {
  Component,
  DocumentTemplate,
  Release,
  Token,
  TokenReference,
  TokenType,
} from "@repo/contracts/type";
import { isRecord } from "@repo/contracts/validation/operations/common";
import {
  assertUniqueIds,
  hasExactFields,
  isNonEmptyString,
  requireArray,
  requireNullableString,
  requireRecord,
  requireString,
} from "@repo/release-protocol/envelope-fields-common";
import { assertKeyId, assertSignatureValue } from "@repo/release-protocol/limits";

export const TOP_LEVEL_FIELDS = [
  "schemaVersion",
  "release",
  "tokenTypes",
  "tokens",
  "references",
  "components",
  "templates",
  "signature",
] as const;

export function invalidEnvelope(message: string): never {
  throw new TypeError(`Invalid signed release envelope: ${message}`);
}

const RELEASE_FIELDS = [
  "id",
  "projectId",
  "version",
  "status",
  "createdAt",
  "publishedAt",
] as const;

export function parseRelease(input: unknown): Release {
  const value = requireRecord(input, RELEASE_FIELDS, "release");
  for (const field of ["id", "projectId", "version", "createdAt"] as const) {
    requireString(value, field, "release");
  }
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.projectId) ||
    !isNonEmptyString(value.version)
  ) {
    invalidEnvelope("release identity fields must be non-empty strings.");
  }
  if (value.status !== "published") {
    invalidEnvelope("release.status must be published.");
  }
  if (!isNonEmptyString(value.publishedAt)) {
    invalidEnvelope("release.publishedAt must be a non-empty string.");
  }
  return value as Release;
}

const SIGNATURE_FIELDS = ["algorithm", "keyId", "value"] as const;

export function parseSignature(input: unknown): ReleaseSignature {
  const value = requireRecord(input, SIGNATURE_FIELDS, "signature");
  if (
    value.algorithm !== "Ed25519" ||
    !isNonEmptyString(value.keyId) ||
    typeof value.value !== "string"
  ) {
    invalidEnvelope("signature metadata is invalid.");
  }
  assertKeyId(value.keyId);
  assertSignatureValue(value.value);
  return {
    algorithm: "Ed25519",
    keyId: value.keyId,
    value: value.value,
  };
}

const TOKEN_KINDS = new Set(["primitive", "semantic"]);

const TOKEN_CATEGORIES = new Set([
  "color",
  "typography",
  "spacing",
  "radius",
  "shadow",
  "motion",
]);

const TOKEN_TYPE_FIELDS = [
  "id",
  "projectId",
  "parentTypeId",
  "category",
  "name",
  "kind",
] as const;

export function parseTokenTypes(input: unknown): TokenType[] {
  const values = requireArray(input, "tokenTypes").map((item, index) => {
    const name = `tokenTypes[${index}]`;
    const value = requireRecord(item, TOKEN_TYPE_FIELDS, name);
    for (const field of ["id", "projectId", "category", "name", "kind"] as const) {
      requireString(value, field, name);
    }
    requireNullableString(value, "parentTypeId", name);
    if (value.parentTypeId === "") {
      invalidEnvelope(`${name}.parentTypeId must not be empty.`);
    }
    if (
      typeof value.kind !== "string" ||
      !TOKEN_KINDS.has(value.kind) ||
      typeof value.category !== "string" ||
      !TOKEN_CATEGORIES.has(value.category)
    ) {
      invalidEnvelope(`${name} has an unsupported kind or category.`);
    }
    return value;
  });
  assertUniqueIds(values, "tokenTypes");
  return values as TokenType[];
}

function parseTokenValue(input: unknown, name: string): void {
  if (
    !isRecord(input) ||
    typeof input.kind !== "string" ||
    (input.kind === "single"
      ? !hasExactFields(input, ["kind", "value"]) || typeof input.value !== "string"
      : !hasExactFields(input, ["kind"]) ||
        !["modes", "typography", "unresolved"].includes(input.kind))
  ) {
    invalidEnvelope(`${name}.value is invalid.`);
  }
}

const TOKEN_FIELDS = [
  "id",
  "projectId",
  "tokenTypeId",
  "name",
  "cssVar",
  "value",
] as const;

export function parseTokens(input: unknown): Token[] {
  const values = requireArray(input, "tokens").map((item, index) => {
    const name = `tokens[${index}]`;
    const value = requireRecord(item, TOKEN_FIELDS, name);
    for (const field of ["id", "projectId", "tokenTypeId", "name"] as const) {
      requireString(value, field, name);
    }
    requireNullableString(value, "cssVar", name);
    parseTokenValue(value.value, name);
    return value;
  });
  assertUniqueIds(values, "tokens");
  return values as Token[];
}

const REFERENCE_FIELDS = [
  "referencingTokenId",
  "referencedTokenId",
  "projectId",
  "slot",
] as const;

const TOKEN_REFERENCE_SLOTS = new Set([
  "value",
  "light",
  "dark",
  "fontSize",
  "fontWeight",
  "lineHeight",
]);

export function parseReferences(input: unknown): TokenReference[] {
  return requireArray(input, "references").map((item, index) => {
    const name = `references[${index}]`;
    const value = requireRecord(item, REFERENCE_FIELDS, name);
    for (const field of [
      "referencingTokenId",
      "referencedTokenId",
      "projectId",
    ] as const) {
      requireString(value, field, name);
    }
    if (typeof value.slot !== "string" || !TOKEN_REFERENCE_SLOTS.has(value.slot)) {
      invalidEnvelope(`${name}.slot is invalid.`);
    }
    return value as TokenReference;
  });
}

const COMPONENT_FIELDS = [
  "id",
  "projectId",
  "name",
  "slug",
  "description",
  "documentPath",
] as const;

export function parseComponents(input: unknown): Component[] {
  const values = requireArray(input, "components").map((item, index) => {
    const name = `components[${index}]`;
    const value = requireRecord(item, COMPONENT_FIELDS, name);
    for (const field of [
      "id",
      "projectId",
      "name",
      "slug",
      "description",
      "documentPath",
    ] as const) {
      requireString(value, field, name);
    }
    return value;
  });
  assertUniqueIds(values, "components");
  return values as Component[];
}

const TEMPLATE_FIELDS = ["id", "projectId", "componentId", "name", "content"] as const;

export function parseTemplates(input: unknown): DocumentTemplate[] {
  const values = requireArray(input, "templates").map((item, index) => {
    const name = `templates[${index}]`;
    const value = requireRecord(item, TEMPLATE_FIELDS, name);
    for (const field of ["id", "projectId", "componentId", "name", "content"] as const) {
      requireString(value, field, name);
    }
    return value;
  });
  assertUniqueIds(values, "templates");
  return values as DocumentTemplate[];
}
