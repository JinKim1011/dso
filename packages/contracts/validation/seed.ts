import type { SeedData } from "@repo/contracts/seed";
import type { ProjectMember, TokenReference } from "@repo/contracts/type";
import { validateDocumentPath } from "@repo/contracts/validation/document-path";
import {
  isSupportedProjectMemberRole,
  isSupportedReleaseStatus,
} from "@repo/contracts/validation/enum";
import { validateIdentifierString } from "@repo/contracts/validation/identifier";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { validateTokenDomain } from "@repo/contracts/validation/token-domain";
import {
  type TokenReferenceValidationError,
  validateTokenReference,
} from "@repo/contracts/validation/token-reference";
import {
  type TokenTypeHierarchyError,
  validateTokenTypeHierarchy,
} from "@repo/contracts/validation/token-type-hierarchy";

export type SeedValidationError = {
  code:
    | "too-many-items"
    | "duplicate-id"
    | "missing-record"
    | "wrong-project"
    | "invalid-reference"
    | "invalid-hierarchy"
    | "invalid-document-path"
    | "invalid-field"
    | "invalid-enum"
    | "invalid-timestamp";
  collection: string;
  id?: string;
  field?: string;
  message: string;
};

function validateTimestamp(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be an ISO timestamp.`;
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== value) {
    return `${fieldName} must use a canonical ISO timestamp such as 2026-10-27T10:00:00.000Z.`;
  }

  return null;
}

function addFieldError(
  errors: SeedValidationError[],
  collection: string,
  id: string | undefined,
  field: string,
  message: string,
): void {
  errors.push({
    code: "invalid-field",
    collection,
    id,
    field,
    message,
  });
}

function mapHierarchyErrorCode(
  code: TokenTypeHierarchyError["code"],
): SeedValidationError["code"] {
  switch (code) {
    case "duplicate-id":
      return "duplicate-id";
    case "wrong-project":
      return "wrong-project";
    case "cycle":
    case "self-parent":
    case "missing-token-type":
    case "cross-project-parent":
      return "invalid-hierarchy";
  }
}

function mapReferenceError(
  code: TokenReferenceValidationError["code"],
): SeedValidationError["code"] {
  switch (code) {
    case "wrong-project":
      return "wrong-project";
    case "incompatible-referenced-token-type":
    case "missing-referenced-token":
    case "missing-referenced-token-type":
    case "missing-referencing-token":
    case "missing-referencing-token-type":
    case "self-reference":
    case "invalid-slot":
    case "unsupported-slot":
      return "invalid-reference";
  }
}

function mapTokenDomainErrorCode(
  code: ReturnType<typeof validateTokenDomain>[number]["code"],
): SeedValidationError["code"] {
  switch (code) {
    case "wrong-project":
      return "wrong-project";
    case "missing-token-type":
    case "unsupported-token-kind":
    case "duplicate-token-type":
    case "duplicate-token":
      return "invalid-reference";
  }
}

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

function validateIdentifierField(
  errors: SeedValidationError[],
  collection: string,
  id: string | undefined,
  field: string,
  value: unknown,
): void {
  const validationError = validateIdentifierString(value, field);

  if (validationError) {
    addFieldError(errors, collection, id, field, validationError.message);
  }
}

function validateDocumentPathField(
  errors: SeedValidationError[],
  collection: string,
  id: string,
  value: unknown,
): void {
  const validationError = validateDocumentPath(value);

  if (validationError) {
    errors.push({
      code: "invalid-document-path",
      collection,
      id,
      field: "documentPath",
      message: validationError.message,
    });
  }
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

function validateMembershipReferences(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const userIds = new Set(seed.users.map((user) => user.id));
  const projectIds = new Set(seed.projects.map((project) => project.id));

  for (const membership of seed.projectMembers) {
    const id = `${membership.projectId}:${membership.userId}`;

    if (!projectIds.has(membership.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "projectMembers",
        id,
        field: "projectId",
        message: `Project "${membership.projectId}" does not exist.`,
      });
    }

    if (!userIds.has(membership.userId)) {
      errors.push({
        code: "missing-record",
        collection: "projectMembers",
        id,
        field: "userId",
        message: `User "${membership.userId}" does not exist.`,
      });
    }

    if (!isSupportedProjectMemberRole(membership.role)) {
      errors.push({
        code: "invalid-enum",
        collection: "projectMembers",
        id,
        field: "role",
        message: `Membership role "${membership.role}" is not supported.`,
      });
    }
  }

  return errors;
}

function validateSeedIdentifiers(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  for (const user of seed.users) {
    validateIdentifierField(errors, "users", user.id, "id", user.id);
  }

  for (const project of seed.projects) {
    validateIdentifierField(errors, "projects", project.id, "id", project.id);
    validateIdentifierField(errors, "projects", project.id, "slug", project.slug);
  }

  for (const membership of seed.projectMembers) {
    const id = `${membership.projectId}:${membership.userId}`;

    validateIdentifierField(
      errors,
      "projectMembers",
      id,
      "projectId",
      membership.projectId,
    );

    validateIdentifierField(errors, "projectMembers", id, "userId", membership.userId);
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

function validateDuplicateReferences(
  references: readonly TokenReference[],
): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const seen = new Set<string>();

  for (const reference of references) {
    const key = [
      reference.projectId,
      reference.referencingTokenId,
      reference.referencedTokenId,
      reference.slot,
    ].join(":");

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

function validateComponentRelationships(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const projectIds = new Set(seed.projects.map((project) => project.id));
  const componentById = new Map(
    seed.components.map((component) => [component.id, component]),
  );

  for (const component of seed.components) {
    if (!projectIds.has(component.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "components",
        id: component.id,
        field: "projectId",
        message: `Project "${component.projectId}" does not exist.`,
      });
    }

    validateDocumentPathField(errors, "components", component.id, component.documentPath);
  }

  for (const template of seed.documentTemplates) {
    const component = componentById.get(template.componentId);

    if (!component) {
      errors.push({
        code: "missing-record",
        collection: "documentTemplates",
        id: template.id,
        field: "componentId",
        message: `Component "${template.componentId}" does not exist.`,
      });
      continue;
    }

    if (!projectIds.has(template.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "documentTemplates",
        id: template.id,
        field: "projectId",
        message: `Project "${template.projectId}" does not exist.`,
      });
    }

    if (component.projectId !== template.projectId) {
      errors.push({
        code: "wrong-project",
        collection: "documentTemplates",
        id: template.id,
        field: "projectId",
        message: `Template "${template.id}" and component "${component.id}" must belong to the same project.`,
      });
    }
  }

  return errors;
}

function validateReleaseRelationships(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const projectIds = new Set(seed.projects.map((project) => project.id));

  for (const release of seed.releases) {
    if (!projectIds.has(release.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "releases",
        id: release.id,
        field: "projectId",
        message: `Project "${release.projectId}" does not exist.`,
      });
    }

    if (!isSupportedReleaseStatus(release.status)) {
      errors.push({
        code: "invalid-enum",
        collection: "releases",
        id: release.id,
        field: "status",
        message: `Release status "${release.status}" is not supported.`,
      });
    }

    if (release.status === "published" && release.publishedAt === null) {
      errors.push({
        code: "invalid-field",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message: "Published releases must have a publishedAt timestamp.",
      });
    }

    if (release.status === "draft" && release.publishedAt !== null) {
      errors.push({
        code: "invalid-field",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message: "Draft releases cannot have a publishedAt timestamp.",
      });
    }
  }

  return errors;
}

function validateSeedTimestamps(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  for (const user of seed.users) {
    const message = validateTimestamp(user.createdAt, "createdAt");

    if (message) {
      errors.push({
        code: "invalid-timestamp",
        collection: "users",
        id: user.id,
        field: "createdAt",
        message,
      });
    }
  }

  for (const project of seed.projects) {
    const message = validateTimestamp(project.createdAt, "createdAt");

    if (message) {
      errors.push({
        code: "invalid-timestamp",
        collection: "projects",
        id: project.id,
        field: "createdAt",
        message,
      });
    }
  }

  for (const release of seed.releases) {
    if (
      release.publishedAt !== null &&
      Date.parse(release.publishedAt) < Date.parse(release.createdAt)
    ) {
      errors.push({
        code: "invalid-timestamp",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message: "publishedAt cannot be earlier than createdAt.",
      });
    }

    if (release.publishedAt === null) {
      continue;
    }

    const message = validateTimestamp(release.publishedAt, "publishedAt");

    if (message) {
      errors.push({
        code: "invalid-timestamp",
        collection: "releases",
        id: release.id,
        field: "publishedAt",
        message,
      });
    }
  }

  return errors;
}

export function validateSeedData(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  errors.push(...validateSeedCollectionSizes(seed));

  errors.push(...findDuplicateIds(seed.users, "users"));
  errors.push(...findDuplicateIds(seed.projects, "projects"));
  errors.push(...findDuplicateIds(seed.tokenTypes, "tokenTypes"));
  errors.push(...findDuplicateIds(seed.components, "components"));
  errors.push(...findDuplicateIds(seed.documentTemplates, "documentTemplates"));
  errors.push(...findDuplicateIds(seed.releases, "releases"));

  errors.push(...validateDuplicateMemberships(seed.projectMembers));
  errors.push(...validateDuplicateReferences(seed.tokenReferences));

  errors.push(...validateSeedIdentifiers(seed));
  errors.push(...validateMembershipReferences(seed));
  errors.push(...validateComponentRelationships(seed));
  errors.push(...validateReleaseRelationships(seed));
  errors.push(...validateSeedTimestamps(seed));

  for (const project of seed.projects) {
    errors.push(
      ...validateTokenDomain(seed.tokens, seed.tokenTypes, project.id).map((error) => ({
        code: mapTokenDomainErrorCode(error.code),
        collection: "tokens",
        id: error.entityId,
        message: error.message,
      })),
    );

    errors.push(
      ...validateTokenTypeHierarchy(seed.tokenTypes, project.id).map((error) => ({
        code: mapHierarchyErrorCode(error.code),
        collection: "tokenTypes",
        id: error.tokenTypeId,
        message: error.message,
      })),
    );
  }

  for (const reference of seed.tokenReferences) {
    errors.push(
      ...validateTokenReference(
        reference,
        seed.tokens,
        seed.tokenTypes,
        reference.projectId,
      ).map((error) => ({
        code: mapReferenceError(error.code),
        collection: "tokenReferences",
        id: `${reference.referencingTokenId}:${reference.referencedTokenId}:${reference.slot}`,
        message: error.message,
      })),
    );
  }

  return errors;
}
