import type { SeedData } from "@repo/contracts/seed";
import type { TokenType } from "@repo/contracts/type";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";
import { validateTokenDomain } from "@repo/contracts/validation/token-domain";
import { validateTokenTypeHierarchy } from "@repo/contracts/validation/token-type-hierarchy";
import {
  expectedValueKind,
  validateTokenValue,
} from "@repo/contracts/validation/token-value";

function mapTokenDomainError(
  error: ReturnType<typeof validateTokenDomain>[number],
): SeedValidationError {
  switch (error.code) {
    case "wrong-project":
      return {
        code: "wrong-project",
        collection: "tokens",
        id: error.entityId,
        message: error.message,
      };

    case "duplicate-token-type":
      return {
        code: "duplicate-id",
        collection: "tokenTypes",
        id: error.entityId,
        message: error.message,
      };

    case "duplicate-token":
      return {
        code: "duplicate-id",
        collection: "tokens",
        id: error.entityId,
        message: error.message,
      };

    case "missing-token-type":
      return {
        code: "missing-record",
        collection: "tokens",
        id: error.entityId,
        message: error.message,
      };

    case "unsupported-token-kind":
      return {
        code: "invalid-enum",
        collection: "tokenTypes",
        id: error.entityId,
        message: error.message,
      };
  }
}

export function validateTokens(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  const tokenTypesByProject = new Map<string, TokenType[]>();

  for (const tokenType of seed.tokenTypes) {
    const projectTypes = tokenTypesByProject.get(tokenType.projectId) ?? [];
    projectTypes.push(tokenType);
    tokenTypesByProject.set(tokenType.projectId, projectTypes);
  }

  for (const [projectId, projectTokenTypes] of tokenTypesByProject) {
    const hierarchyErrors = validateTokenTypeHierarchy(projectTokenTypes, projectId);

    errors.push(
      ...hierarchyErrors.map((error) => ({
        code:
          error.code === "wrong-project"
            ? ("wrong-project" as const)
            : error.code === "duplicate-id"
              ? ("duplicate-id" as const)
              : ("invalid-hierarchy" as const),
        collection: "tokenTypes",
        id: error.tokenTypeId,
        message: error.message,
      })),
    );
  }

  for (const project of seed.projects) {
    const projectTokens = seed.tokens.filter((token) => token.projectId === project.id);

    const projectTokenTypes = seed.tokenTypes.filter(
      (tokenType) => tokenType.projectId === project.id,
    );

    const domainErrors = validateTokenDomain(
      projectTokens,
      projectTokenTypes,
      project.id,
    );

    errors.push(...domainErrors.map(mapTokenDomainError));
  }

  const tokenTypesById = new Map(
    seed.tokenTypes.map((tokenType) => [tokenType.id, tokenType]),
  );

  for (const token of seed.tokens) {
    const valueErrors = validateTokenValue(token.value);

    for (const error of valueErrors) {
      errors.push({
        code: "invalid-field",
        collection: "tokens",
        id: token.id,
        field: error.field,
        message: error.message,
      });
    }

    const tokenType = tokenTypesById.get(token.tokenTypeId);

    if (!tokenType || !("kind" in token.value)) {
      continue;
    }

    const expectedKind = expectedValueKind(tokenType);

    if (expectedKind && token.value.kind !== expectedKind) {
      errors.push({
        code: "invalid-field",
        collection: "tokens",
        id: token.id,
        field: "value.kind",
        message:
          `Token "${token.id}" uses value.kind "${token.value.kind}", ` +
          `but token type "${tokenType.id}" requires "${expectedKind}".`,
      });
    }
  }

  return errors;
}
