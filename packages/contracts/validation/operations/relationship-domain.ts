import type {
  AddTokenReferenceRequest,
  ChangeTokenTypeParentRequest,
} from "@repo/contracts/operation";
import { Token, TokenReference, TokenType } from "@repo/contracts/type";
import { validateTokenReference } from "@repo/contracts/validation/token-reference";
import {
  TokenTypeHierarchyError,
  validateTokenTypeHierarchy,
} from "@repo/contracts/validation/token-type-hierarchy";

export type AddReferenceValidationError = {
  code: "invalid-request" | "invalid-reference";
  message: string;
};

export function validateAddReferenceOperation(
  request: AddTokenReferenceRequest,
  tokens: readonly Token[],
  tokenTypes: readonly TokenType[],
): AddReferenceValidationError[] {
  const reference: TokenReference = {
    projectId: request.projectId,
    referencedTokenId: request.referencedTokenId,
    referencingTokenId: request.referencingTokenId,
    slot: request.slot,
  };

  return validateTokenReference(reference, tokens, tokenTypes, request.projectId).map(
    (error) => ({
      code: "invalid-reference" as const,
      message: error.message,
    }),
  );
}

export function validateChangeParentOperation(
  request: ChangeTokenTypeParentRequest,
  tokenTypes: readonly TokenType[],
): TokenTypeHierarchyError[] {
  const target = tokenTypes.find((tokenType) => tokenType.id === request.tokenTypeId);

  if (!target) {
    return [
      {
        code: "missing-token-type",
        tokenTypeId: request.tokenTypeId,
        message: `Token type "${request.tokenTypeId}" does not exist.`,
      },
    ];
  }

  const candidateTypes = tokenTypes.map((tokenType) =>
    tokenType.id === request.tokenTypeId
      ? { ...tokenType, parentTypeId: request.parentTypeId }
      : tokenType,
  );

  return validateTokenTypeHierarchy(candidateTypes, request.projectId);
}
