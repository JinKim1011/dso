import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import type {
  Token,
  TokenReference,
  TokenReferenceSlot,
  TokenType,
} from "@repo/contracts/type";
import { isCompatibleReferencedType } from "@repo/contracts/validation/token-reference-compatibility";
import { supportsTokenReferenceSlot } from "@repo/contracts/validation/token-reference-slots";
import { TokenGraphValidationError } from "@repo/generator/errors";

export type TokenGraphIndex = Readonly<{
  tokenTypeById: ReadonlyMap<string, TokenType>;
  tokenById: ReadonlyMap<string, Token>;
  referencesByTokenAndSlot: ReadonlyMap<
    string,
    ReadonlyMap<TokenReferenceSlot, TokenReference>
  >;
  tokensByTypeId: ReadonlyMap<string, readonly Token[]>;
}>;

function assertProjectId(
  entityProjectId: string,
  projectId: string,
  details: {
    tokenId?: string;
    tokenTypeId?: string;
    slot?: TokenReferenceSlot;
  },
): void {
  if (entityProjectId !== projectId) {
    throw new TokenGraphValidationError(
      "wrong-project",
      "Token graph entities must belong to the release project.",
      details,
    );
  }
}

export function buildTokenGraphIndex(release: PublishedReleaseResponse): TokenGraphIndex {
  const projectId = release.release.projectId;
  const tokenTypeById = new Map<string, TokenType>();
  const tokenById = new Map<string, Token>();
  const tokensByTypeId = new Map<string, Token[]>();
  const referencesByTokenAndSlot = new Map<
    string,
    Map<TokenReferenceSlot, TokenReference>
  >();

  for (const tokenType of release.tokenTypes) {
    if (tokenTypeById.has(tokenType.id)) {
      throw new TokenGraphValidationError(
        "duplicate-token-type",
        `Token type "${tokenType.id}" appears more than once.`,
        { tokenTypeId: tokenType.id },
      );
    }

    assertProjectId(tokenType.projectId, projectId, {
      tokenTypeId: tokenType.id,
    });

    tokenTypeById.set(tokenType.id, tokenType);
  }

  for (const token of release.tokens) {
    if (tokenById.has(token.id)) {
      throw new TokenGraphValidationError(
        "duplicate-token",
        `Token "${token.id}" appears more than once.`,
        { tokenId: token.id },
      );
    }

    assertProjectId(token.projectId, projectId, { tokenId: token.id });

    if (!tokenTypeById.has(token.tokenTypeId)) {
      throw new TokenGraphValidationError(
        "missing-token-type",
        `Token "${token.id}" references an unknown token type.`,
        { tokenId: token.id, tokenTypeId: token.tokenTypeId },
      );
    }

    tokenById.set(token.id, token);

    const tokensForType = tokensByTypeId.get(token.tokenTypeId) ?? [];
    tokensForType.push(token);

    tokensByTypeId.set(token.tokenTypeId, tokensForType);
  }

  for (const reference of release.references) {
    const { referencingTokenId, referencedTokenId, slot } = reference;
    const source = tokenById.get(referencingTokenId);
    const target = tokenById.get(referencedTokenId);

    assertProjectId(reference.projectId, projectId, {
      tokenId: referencingTokenId,
      slot,
    });

    if (!source) {
      throw new TokenGraphValidationError(
        "missing-referencing-token",
        `Reference source token "${referencingTokenId}" does not exist.`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    if (!target) {
      throw new TokenGraphValidationError(
        "missing-referenced-token",
        `Reference target token "${referencedTokenId}" does not exist.`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    if (referencingTokenId === referencedTokenId) {
      throw new TokenGraphValidationError(
        "self-reference",
        `Token "${referencingTokenId}" cannot reference itself in slot "${slot}".`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    const sourceType = tokenTypeById.get(source.tokenTypeId)!;
    const targetType = tokenTypeById.get(target.tokenTypeId)!;

    if (sourceType.kind === "primitive") {
      throw new TokenGraphValidationError(
        "primitive-reference-source",
        `Primitive token "${referencingTokenId}" cannot contain a semantic reference.`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    if (!supportsTokenReferenceSlot(source, sourceType, slot)) {
      throw new TokenGraphValidationError(
        "unsupported-reference-slot",
        `Token "${referencingTokenId}" does not support reference slot "${slot}".`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    if (!isCompatibleReferencedType(target, sourceType, targetType, slot)) {
      throw new TokenGraphValidationError(
        "incompatible-reference-target",
        `Token "${referencingTokenId}" reference target for slot "${slot}" is incompatible.`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    if (target.cssVar === null) {
      throw new TokenGraphValidationError(
        "missing-reference-css-var",
        `Reference target token "${referencedTokenId}" has no CSS variable name.`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    const sourceReferences =
      referencesByTokenAndSlot.get(referencingTokenId) ??
      new Map<TokenReferenceSlot, TokenReference>();

    if (sourceReferences.has(slot)) {
      throw new TokenGraphValidationError(
        "duplicate-reference-slot",
        `Token "${referencingTokenId}" has more than one reference for slot "${slot}".`,
        { tokenId: referencingTokenId, slot, targetTokenId: referencedTokenId },
      );
    }

    sourceReferences.set(slot, reference);

    referencesByTokenAndSlot.set(referencingTokenId, sourceReferences);
  }

  return {
    tokenTypeById,
    tokenById,
    referencesByTokenAndSlot,
    tokensByTypeId,
  };
}
