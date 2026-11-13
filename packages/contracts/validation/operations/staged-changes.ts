import type {
  ReferenceChange,
  SaveStagedChangesRequest,
  StagedTokenChange,
} from "@repo/contracts/operation";
import type { TokenValue } from "@repo/contracts/type";
import {
  CONTRACT_LIMITS,
  validateCollectionSize,
} from "@repo/contracts/validation/limit";
import {
  type ValidationIssue,
  type ValidationResult,
  collectUnknownFields,
  invalidObject,
  invalidRequestBody,
  isRecord,
  validateLimitedStringField,
  validateUuidField,
} from "@repo/contracts/validation/operations/common";
import { tokenReferenceSlots } from "@repo/contracts/validation/token-reference-slots";
import { validateTokenValue } from "@repo/contracts/validation/token-value";

const REQUEST_FIELDS = [
  "projectId",
  "changes",
] as const satisfies readonly (keyof SaveStagedChangesRequest)[];

const TOKEN_CHANGE_FIELDS = [
  "tokenId",
  "name",
  "value",
  "references",
] as const satisfies readonly (keyof StagedTokenChange)[];

const REFERENCE_CHANGE_FIELDS = [
  "slot",
  "beforeTokenId",
  "afterTokenId",
] as const satisfies readonly (keyof ReferenceChange)[];

const CHANGE_PAIR_FIELDS = ["before", "after"] as const;

function parseName(input: unknown, path: string): ValidationResult<string> {
  const issue = validateLimitedStringField(input, path, CONTRACT_LIMITS.tokenName);
  if (issue) return { success: false, issues: [issue] };
  if (typeof input !== "string") {
    throw new Error("Name validation accepted a non-string value.");
  }
  return { success: true, value: input };
}

function parseTokenValue(input: unknown, path: string): ValidationResult<TokenValue> {
  const issues = validateTokenValue(input).map((issue) => ({
    ...issue,
    field: `${path}${issue.field.slice("value".length)}`,
  }));
  if (issues.length > 0) return { success: false, issues };

  return { success: true, value: input as TokenValue };
}

function parseChangePair<T>(
  input: unknown,
  path: string,
  parseValue: (value: unknown, path: string) => ValidationResult<T>,
): ValidationResult<{ before: T; after: T }> {
  if (!isRecord(input)) return invalidObject(path);

  const issues = collectUnknownFields(input, CHANGE_PAIR_FIELDS, path);
  const before = parseValue(input.before, `${path}.before`);
  const after = parseValue(input.after, `${path}.after`);
  if (!before.success) issues.push(...before.issues);
  if (!after.success) issues.push(...after.issues);

  if (issues.length > 0 || !before.success || !after.success) {
    return { success: false, issues };
  }
  return { success: true, value: { before: before.value, after: after.value } };
}

function parseReference(input: unknown, path: string): ValidationResult<ReferenceChange> {
  if (!isRecord(input)) return invalidObject(path);

  const issues = collectUnknownFields(input, REFERENCE_CHANGE_FIELDS, path);
  const slot = tokenReferenceSlots.find((candidate) => candidate === input.slot);
  if (!slot) {
    issues.push({
      field: `${path}.slot`,
      code: "unsupported-value",
      message: `${path}.slot must be one of: ${tokenReferenceSlots.join(", ")}.`,
    });
  }
  for (const field of ["beforeTokenId", "afterTokenId"] as const) {
    if (input[field] !== null) {
      const issue = validateUuidField(input[field], `${path}.${field}`);
      if (issue) issues.push(issue);
    }
  }

  if (issues.length > 0 || !slot) return { success: false, issues };
  return {
    success: true,
    value: {
      slot,
      beforeTokenId: input.beforeTokenId as string | null,
      afterTokenId: input.afterTokenId as string | null,
    },
  };
}

function parseReferences(
  input: unknown,
  path: string,
): ValidationResult<ReferenceChange[]> {
  if (!Array.isArray(input)) {
    return {
      success: false,
      issues: [
        { field: path, code: "invalid-type", message: `${path} must be an array.` },
      ],
    };
  }
  const limitIssue = validateCollectionSize(input, path, tokenReferenceSlots.length);
  if (limitIssue) return { success: false, issues: [{ field: path, ...limitIssue }] };

  const issues: ValidationIssue[] = [];
  const references: ReferenceChange[] = [];
  const slots = new Set<string>();
  for (const [index, item] of input.entries()) {
    const reference = parseReference(item, `${path}[${index}]`);
    if (!reference.success) {
      issues.push(...reference.issues);
      continue;
    }
    if (slots.has(reference.value.slot)) {
      issues.push({
        field: `${path}[${index}].slot`,
        code: "invalid-format",
        message: `Duplicate reference slot "${reference.value.slot}".`,
      });
    }
    slots.add(reference.value.slot);
    references.push(reference.value);
  }
  if (issues.length > 0) return { success: false, issues };
  return { success: true, value: references };
}

function parseTokenChange(
  input: unknown,
  path: string,
): ValidationResult<StagedTokenChange> {
  if (!isRecord(input)) return invalidObject(path);

  const issues = collectUnknownFields(input, TOKEN_CHANGE_FIELDS, path);
  const idIssue = validateUuidField(input.tokenId, `${path}.tokenId`);
  if (idIssue) issues.push(idIssue);

  const name =
    "name" in input ? parseChangePair(input.name, `${path}.name`, parseName) : undefined;
  const value =
    "value" in input
      ? parseChangePair(input.value, `${path}.value`, parseTokenValue)
      : undefined;
  if (name && !name.success) issues.push(...name.issues);
  if (value && !value.success) issues.push(...value.issues);

  const references = parseReferences(input.references, `${path}.references`);
  if (!references.success) issues.push(...references.issues);

  if (issues.length > 0 || typeof input.tokenId !== "string" || !references.success) {
    return { success: false, issues };
  }
  return {
    success: true,
    value: {
      tokenId: input.tokenId,
      ...(name?.success && { name: name.value }),
      ...(value?.success && { value: value.value }),
      references: references.value,
    },
  };
}

export function parseSaveStagedChangesRequest(
  input: unknown,
): ValidationResult<SaveStagedChangesRequest> {
  if (!isRecord(input)) return invalidRequestBody();

  const issues = collectUnknownFields(input, REQUEST_FIELDS);
  const projectIdIssue = validateUuidField(input.projectId, "projectId");
  if (projectIdIssue) issues.push(projectIdIssue);

  const changes: StagedTokenChange[] = [];
  if (!Array.isArray(input.changes)) {
    issues.push({
      field: "changes",
      code: "invalid-type",
      message: "changes must be an array.",
    });
  } else {
    const limitIssue = validateCollectionSize(
      input.changes,
      "changes",
      CONTRACT_LIMITS.collectionItems,
    );
    if (limitIssue) {
      issues.push({ field: "changes", ...limitIssue });
    } else {
      const tokenIds = new Set<string>();
      for (const [index, item] of input.changes.entries()) {
        const change = parseTokenChange(item, `changes[${index}]`);
        if (!change.success) {
          issues.push(...change.issues);
          continue;
        }
        const tokenId = change.value.tokenId.toLowerCase();
        if (tokenIds.has(tokenId)) {
          issues.push({
            field: `changes[${index}].tokenId`,
            code: "invalid-format",
            message: `Duplicate token ID "${change.value.tokenId}".`,
          });
        }
        tokenIds.add(tokenId);
        changes.push(change.value);
      }
    }
  }

  if (issues.length > 0 || typeof input.projectId !== "string") {
    return { success: false, issues };
  }
  return { success: true, value: { projectId: input.projectId, changes } };
}
