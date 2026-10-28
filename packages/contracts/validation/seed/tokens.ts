import type { SeedData } from "@repo/contracts/seed";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";
import { validateTokenDomain } from "@repo/contracts/validation/token-domain";
import { validateTokenTypeHierarchy } from "@repo/contracts/validation/token-type-hierarchy";

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

  for (const project of seed.projects) {
    const domainErrors = validateTokenDomain(seed.tokens, seed.tokenTypes, project.id);

    errors.push(...domainErrors.map(mapTokenDomainError));

    const hierarchyErrors = validateTokenTypeHierarchy(seed.tokenTypes, project.id);

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

  return errors;
}
