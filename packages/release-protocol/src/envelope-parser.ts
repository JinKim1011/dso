import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import {
  invalidEnvelope,
  parseComponents,
  parseReferences,
  parseRelease,
  parseSignature,
  parseTemplates,
  parseTokens,
  parseTokenTypes,
  TOP_LEVEL_FIELDS,
} from "@repo/release-protocol/envelope-fields";
import { requireRecord } from "@repo/release-protocol/envelope-fields-common";
import { assertRelationships } from "@repo/release-protocol/envelope-relationships";
import { assertResponseSize } from "@repo/release-protocol/limits";

export function parseEnvelope(input: unknown): SignedPublishedReleaseResponse {
  assertResponseSize(input);

  const value = requireRecord(input, TOP_LEVEL_FIELDS, "root");
  if (value.schemaVersion !== 1) {
    invalidEnvelope("schemaVersion must be 1.");
  }

  const envelope: Omit<SignedPublishedReleaseResponse, "signature"> = {
    schemaVersion: 1,
    release: parseRelease(value.release),
    tokenTypes: parseTokenTypes(value.tokenTypes),
    tokens: parseTokens(value.tokens),
    references: parseReferences(value.references),
    components: parseComponents(value.components),
    templates: parseTemplates(value.templates),
  };

  assertRelationships(envelope);

  return {
    ...envelope,
    signature: parseSignature(value.signature),
  };
}
