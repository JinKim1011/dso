import type { SeedData } from "@repo/contracts/seed";
import type { ProjectMember, TokenReference } from "@repo/contracts/type";
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

function findDuplicateIds<T extends { id: string }>(
  records: readonly T[],
  collection: string,
): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const seen = new Set<string>();

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

function validateDuplicateMemberships(
  memberships: readonly ProjectMember[],
): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const seen = new Set<string>();

  for (const membership of memberships) {
    const key = `${membership.projectId}:${membership.userId}`;

    if (seen.has(key)) {
      errors.push({
        code: "duplicate-id",
        collection: "projectMembers",
        id: key,
        message: `Duplicate membership for project "${membership.projectId}" and user "${membership.userId}".`,
      });
    }

    seen.add(key);
  }

  return errors;
}

function validateDuplicateReferences(
  references: readonly TokenReference[],
): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const seen = new Set<string>();

  for (const reference of references) {
    const key = `${reference.referencedTokenId}:${reference.referencingTokenId}:${reference.slot}`;

    if (seen.has(key)) {
      errors.push({
        code: "duplicate-id",
        collection: "tokenReferences",
        id: key,
        message: `Duplicate reference for referencing token "${reference.referencingTokenId}", referenced token "${reference.referencedTokenId}, and slot "${reference.slot}".`,
      });
    }

    seen.add(key);
  }

  return errors;
}
