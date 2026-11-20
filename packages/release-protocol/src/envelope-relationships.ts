import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { invalidEnvelope } from "@repo/release-protocol/envelope-fields";

export function assertRelationships(
  envelope: Omit<SignedPublishedReleaseResponse, "signature">,
): void {
  const tokenTypeIds = new Set(envelope.tokenTypes.map(({ id }) => id));
  const tokenIds = new Set(envelope.tokens.map(({ id }) => id));
  const componentIds = new Set(envelope.components.map(({ id }) => id));
  const projectId = envelope.release.projectId;

  const entities = [
    ...envelope.tokenTypes,
    ...envelope.tokens,
    ...envelope.references,
    ...envelope.components,
    ...envelope.templates,
  ];

  for (const entity of entities) {
    if (entity.projectId !== projectId) {
      invalidEnvelope("snapshot entity projectId does not match release.projectId.");
    }
  }

  for (const token of envelope.tokens) {
    if (!tokenTypeIds.has(token.tokenTypeId)) {
      invalidEnvelope(`token "${token.id}" references an unknown token type.`);
    }
  }

  for (const reference of envelope.references) {
    if (!tokenIds.has(reference.referencingTokenId)) {
      invalidEnvelope("reference has an unknown source token.");
    }

    if (!tokenIds.has(reference.referencedTokenId)) {
      invalidEnvelope("reference has an unknown target token.");
    }
  }

  for (const template of envelope.templates) {
    if (!componentIds.has(template.componentId)) {
      invalidEnvelope(`template "${template.id}" references an unknown component.`);
    }
  }
}
