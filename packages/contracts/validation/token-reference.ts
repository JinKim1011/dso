import type { Token, TokenReference, TokenType } from "@repo/contracts/type";
import { isCompatibleReferencedType } from "@repo/contracts/validation/token-reference-compatibility";
import {
  supportsTokenReferenceSlot,
  tokenReferenceSlots,
} from "@repo/contracts/validation/token-reference-slots";

export type TokenReferenceValidationError = {
  code:
    | "missing-referencing-token"
    | "missing-referenced-token"
    | "wrong-project"
    | "self-reference"
    | "invalid-slot"
    | "unsupported-slot"
    | "missing-referencing-token-type"
    | "missing-referenced-token-type"
    | "incompatible-referenced-token-type";
  message: string;
};

export function validateTokenReference(
  reference: TokenReference,
  tokens: readonly Token[],
  tokenTypes: readonly TokenType[],
  projectId: string,
): TokenReferenceValidationError[] {
  const errors: TokenReferenceValidationError[] = [];

  const tokenById = new Map(tokens.map((token) => [token.id, token]));

  const referencedToken = tokenById.get(reference.referencedTokenId);

  if (!referencedToken) {
    errors.push({
      code: "missing-referenced-token",
      message: `Referenced token "${reference.referencedTokenId}" does not exist.`,
    });
  }

  const referencingToken = tokenById.get(reference.referencingTokenId);

  if (!referencingToken) {
    errors.push({
      code: "missing-referencing-token",
      message: `Referencing token "${reference.referencingTokenId}" does not exist.`,
    });
  }

  if (!referencedToken || !referencingToken) {
    return errors;
  }

  const tokenTypeById = new Map(tokenTypes.map((tokenType) => [tokenType.id, tokenType]));

  const referencingTokenType = tokenTypeById.get(referencingToken.tokenTypeId);

  if (!referencingTokenType) {
    errors.push({
      code: "missing-referencing-token-type",
      message: `Token type "${referencingToken.tokenTypeId}" does not exist.`,
    });

    return errors;
  }

  const referencedTokenType = tokenTypeById.get(referencedToken.tokenTypeId);

  if (!referencedTokenType) {
    errors.push({
      code: "missing-referenced-token-type",
      message: `Token type "${referencedToken.tokenTypeId}" does not exist.`,
    });

    return errors;
  }

  if (
    referencingToken.projectId !== projectId ||
    referencedToken.projectId !== projectId ||
    referencingTokenType.projectId !== projectId ||
    referencedTokenType.projectId !== projectId
  ) {
    errors.push({
      code: "wrong-project",
      message: "Tokens and token types must belong to the requested project.",
    });
  }

  if (reference.referencedTokenId === reference.referencingTokenId) {
    errors.push({
      code: "self-reference",
      message: "A token cannot reference itself.",
    });
  }

  const slot = reference.slot;

  if (!tokenReferenceSlots.includes(slot)) {
    errors.push({
      code: "invalid-slot",
      message: `Reference slot "${slot}" is not supported.`,
    });

    return errors;
  }

  if (!supportsTokenReferenceSlot(referencingToken, referencingTokenType, slot)) {
    errors.push({
      code: "unsupported-slot",
      message: `The "${referencingTokenType.category}" token does not support the "${slot}" slot.`,
    });
  }

  if (
    !isCompatibleReferencedType(
      referencedToken,
      referencedTokenType,
      referencingTokenType,
      slot,
    )
  ) {
    errors.push({
      code: "incompatible-referenced-token-type",
      message: `The referenced token is not compatible with the "${slot}" slot.`,
    });
  }

  return errors;
}
