import type { SeedData } from "@repo/contracts/seed";
import { CONTRACT_LIMITS, validateStringLength } from "@repo/contracts/validation/limit";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

function validateLimitedField(
  errors: SeedValidationError[],
  collection: string,
  id: string,
  field: string,
  value: unknown,
  maximum: number,
): void {
  const error = validateStringLength(value, field, maximum);

  if (!error) {
    return;
  }

  errors.push({
    code: "invalid-field",
    collection,
    id,
    field,
    message: error.message,
  });
}

export function validateSeedFieldLengths(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  for (const project of seed.projects) {
    validateLimitedField(
      errors,
      "projects",
      project.id,
      "name",
      project.name,
      CONTRACT_LIMITS.projectName,
    );

    validateLimitedField(
      errors,
      "projects",
      project.id,
      "slug",
      project.slug,
      CONTRACT_LIMITS.projectSlug,
    );
  }

  for (const token of seed.tokens) {
    validateLimitedField(
      errors,
      "tokens",
      token.id,
      "name",
      token.name,
      CONTRACT_LIMITS.tokenName,
    );

    if (token.cssVar !== null) {
      validateLimitedField(
        errors,
        "tokens",
        token.id,
        "cssVar",
        token.cssVar,
        CONTRACT_LIMITS.cssVariable,
      );
    }
  }

  for (const component of seed.components) {
    validateLimitedField(
      errors,
      "components",
      component.id,
      "name",
      component.name,
      CONTRACT_LIMITS.componentName,
    );

    validateLimitedField(
      errors,
      "components",
      component.id,
      "description",
      component.description,
      CONTRACT_LIMITS.componentDescriptions,
      { allowWhitespaceControls: true },
    );
  }

  for (const template of seed.documentTemplates) {
    validateLimitedField(
      errors,
      "documentTemplates",
      template.id,
      "name",
      template.name,
      CONTRACT_LIMITS.templateName,
    );

    validateLimitedField(
      errors,
      "documentTemplates",
      template.id,
      "content",
      template.content,
      CONTRACT_LIMITS.templateContent,
      { allowWhitespaceControls: true },
    );
  }

  for (const release of seed.releases) {
    validateLimitedField(
      errors,
      "releases",
      release.id,
      "version",
      release.version,
      CONTRACT_LIMITS.releaseVersion,
    );
  }

  return errors;
}
