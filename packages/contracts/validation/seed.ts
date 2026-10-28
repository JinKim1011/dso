import type { SeedData } from "@repo/contracts/seed";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";

export type SeedValidationError = {
  code:
    | "too-many-items"
    | "duplicate-id"
    | "missing-record"
    | "wrong-project"
    | "invalid-reference"
    | "invalid-hierarchy"
    | "invalid-document-path";
  collection: string;
  id?: string;
  message: string;
};

function validateSeedCollectionSizes(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

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

  for (const [collection, records] of collections) {
    if (records.length > CONTRACT_LIMITS.collectionItems) {
      errors.push({
        code: "too-many-items",
        collection,
        message: `${collection} cannot contain more than ${CONTRACT_LIMITS.collectionItems} items.`,
      });
    }
  }

  return errors;
}
