import type { SeedData } from "@repo/contracts/seed";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";
import { validateTokenReference } from "@repo/contracts/validation/token-reference";

export function validateTokenReferences(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  for (const reference of seed.tokenReferences) {
    const referenceErrors = validateTokenReference(
      reference,
      seed.tokens,
      seed.tokenTypes,
      reference.projectId,
    );

    errors.push(
      ...referenceErrors.map((error) => ({
        code:
          error.code === "wrong-project"
            ? ("wrong-project" as const)
            : ("invalid-reference" as const),
        collection: "tokenReferences",
        id: [
          reference.referencingTokenId,
          reference.referencedTokenId,
          reference.slot,
        ].join(":"),
        message: error.message,
      })),
    );
  }

  return errors;
}

export function validateDuplicateReferences(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const seen = new Set<string>();

  for (const reference of seed.tokenReferences) {
    const key = JSON.stringify([reference.referencingTokenId, reference.slot]);

    if (seen.has(key)) {
      errors.push({
        code: "duplicate-id",
        collection: "tokenReferences",
        id: key,
        message: `Duplicate token reference "${key}".`,
      });
    }

    seen.add(key);
  }

  return errors;
}
