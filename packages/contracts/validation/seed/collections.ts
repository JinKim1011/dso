import type { SeedData } from "@repo/contracts/seed";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function validateSeedCollectionSizes(seed: SeedData): SeedValidationError[] {
  const collections = [
    ["users", seed.users],
    ["projects", seed.projects],
    ["projectMembers", seed.projectMembers],
    ["tokenTypes", seed.tokenTypes],
    ["tokens", seed.tokens],
    ["tokenReferences", seed.tokenReferences],
    ["components", seed.components],
    ["documentTemplates", seed.documentTemplates],
    ["releases", seed.releases],
  ] as const;

  return collections.flatMap(([collection, records]) =>
    records.length > CONTRACT_LIMITS.collectionItems
      ? [
          {
            code: "too-many-items" as const,
            collection,
            message: `${collection} cannot contain more than ${CONTRACT_LIMITS.collectionItems} items.`,
          },
        ]
      : [],
  );
}

export function findDuplicateIds<T extends { id: string }>(
  records: readonly T[],
  collection: string,
): SeedValidationError[] {
  const seen = new Set<string>();
  const errors: SeedValidationError[] = [];

  for (const record of records) {
    if (seen.has(record.id)) {
      errors.push({
        code: "duplicate-id",
        collection,
        id: record.id,
        message: `${collection} contains duplicate ID "${record.id}".`,
      });
    }

    seen.add(record.id);
  }

  return errors;
}
