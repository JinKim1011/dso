import { AddTokenReferenceRequest } from "@repo/contracts/operation";
import { Token, TokenReference, TokenType } from "@repo/contracts/type";
import { validateTokenReference } from "@repo/contracts/validation/token-reference";

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
