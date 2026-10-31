import type { TokenType } from "@repo/contracts/type";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function validateTokenTypeInsertionOrder(
  tokenTypes: TokenType[],
): SeedValidationError[] {
  const indexByTokenTypeKey = new Map<string, number>();

  for (const [index, tokenType] of tokenTypes.entries()) {
    indexByTokenTypeKey.set(tokenTypeKey(tokenType.projectId, tokenType.id), index);
  }

  const errors: SeedValidationError[] = [];

  for (const [index, tokenType] of tokenTypes.entries()) {
    if (tokenType.parentTypeId === null) {
      continue;
    }

    const parentIndex = indexByTokenTypeKey.get(
      tokenTypeKey(tokenType.projectId, tokenType.parentTypeId),
    );

    // Missing parents and other hierarchy errors are handled by validateTokenTypeHierarchy.
    // This validator only checks ordering.
    if (parentIndex === undefined || parentIndex < index) {
      continue;
    }

    errors.push({
      code: "invalid-hierarchy",
      collection: "tokenTypes",
      id: tokenType.id,
      field: "parentTypeId",
      message:
        `Token type "${tokenType.id}" must appear after its parent ` +
        `"${tokenType.parentTypeId}" in seed.tokenTypes.`,
    });
  }

  return errors;
}

function tokenTypeKey(projectId: string, tokenTypeId: string): string {
  return `${projectId}:${tokenTypeId}`;
}
