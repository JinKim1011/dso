import type { SeedData } from "@repo/contracts/seed";
import { validateIdentifierString } from "@repo/contracts/validation/identifier";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

function validateIdentifierField(
  errors: SeedValidationError[],
  collection: string,
  id: string | undefined,
  field: string,
  value: unknown,
): void {
  const validationError = validateIdentifierString(value, field);

  if (validationError) {
    errors.push({
      code: "invalid-field",
      collection,
      id,
      field,
      message: validationError.message,
    });
  }
}

export function validateSeedIdentifiers(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  for (const user of seed.users) {
    validateIdentifierField(errors, "users", user.id, "id", user.id);
  }

  for (const project of seed.projects) {
    validateIdentifierField(errors, "projects", project.id, "id", project.id);
    validateIdentifierField(errors, "projects", project.id, "slug", project.slug);
  }

  for (const tokenType of seed.tokenTypes) {
    validateIdentifierField(errors, "tokenTypes", tokenType.id, "id", tokenType.id);
    validateIdentifierField(
      errors,
      "tokenTypes",
      tokenType.id,
      "projectId",
      tokenType.projectId,
    );
  }

  for (const token of seed.tokens) {
    validateIdentifierField(errors, "tokens", token.id, "id", token.id);
    validateIdentifierField(errors, "tokens", token.id, "projectId", token.projectId);
    validateIdentifierField(errors, "tokens", token.id, "tokenTypeId", token.tokenTypeId);
  }

  return errors;
}
