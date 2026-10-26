import { isSupportedTokenKind } from "@repo/contracts/token-kind";
import type { Token, TokenType } from "@repo/contracts/type";

export type TokenDomainValidationError = {
  code:
    | "unsupported-token-kind"
    | "duplicate-token-type"
    | "duplicate-token"
    | "wrong-project"
    | "missing-token-type";
  entityId: string;
  message: string;
};

export function validateTokenDomain(
  tokens: readonly Token[],
  tokenTypes: readonly TokenType[],
  projectId: string,
): TokenDomainValidationError[] {
  const errors: TokenDomainValidationError[] = [];
  const tokenTypeById = new Map<string, TokenType>();

  for (const tokenType of tokenTypes) {
    if (!isSupportedTokenKind(tokenType.kind)) {
      errors.push({
        code: "unsupported-token-kind",
        entityId: tokenType.id,
        message: `Token type "${tokenType.id}" has an unsupported kind.`,
      });
    }

    if (tokenTypeById.has(tokenType.id)) {
      errors.push({
        code: "duplicate-token-type",
        entityId: tokenType.id,
        message: `Token type "${tokenType.id}" appears more than once.`,
      });
    }

    tokenTypeById.set(tokenType.id, tokenType);

    if (tokenType.projectId !== projectId) {
      errors.push({
        code: "wrong-project",
        entityId: tokenType.id,
        message: `Token type "${tokenType.id}" belongs to another project.`,
      });
    }
  }

  const tokenIds = new Set<string>();

  for (const token of tokens) {
    if (tokenIds.has(token.id)) {
      errors.push({
        code: "duplicate-token",
        entityId: token.id,
        message: `Token "${token.id}" appears more than once.`,
      });
    }

    tokenIds.add(token.id);

    if (token.projectId !== projectId) {
      errors.push({
        code: "wrong-project",
        entityId: token.id,
        message: `Token "${token.id}" belongs to another project.`,
      });
    }

    if (!tokenTypeById.has(token.tokenTypeId)) {
      errors.push({
        code: "missing-token-type",
        entityId: token.id,
        message: `Token type "${token.tokenTypeId}" does not exist.`,
      });
    }
  }

  return errors;
}
