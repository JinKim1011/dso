import type { CreateApiKeyRequest, RevokeApiKeyRequest } from "@repo/contracts/operation";
import { isSupportedApiKeyScope } from "@repo/contracts/validation/enum";
import {
  type ValidationResult,
  collectUnknownFields,
  invalidRequestBody,
  isRecord,
  validateIdentifierField,
} from "@repo/contracts/validation/operations/common";
import { validateTimestamp } from "@repo/contracts/validation/timestamp";

const CREATE_API_KEY_FIELDS = [
  "projectId",
  "expiresAt",
  "scope",
] as const satisfies readonly (keyof CreateApiKeyRequest)[];

const REVOKE_API_KEY_FIELDS = [
  "projectId",
  "apiKeyId",
] as const satisfies readonly (keyof RevokeApiKeyRequest)[];

export function parseCreateApiKeyRequest(
  input: unknown,
): ValidationResult<CreateApiKeyRequest> {
  if (!isRecord(input)) {
    return invalidRequestBody();
  }

  const issues = collectUnknownFields(input, CREATE_API_KEY_FIELDS);
  const projectIssue = validateIdentifierField(input.projectId, "projectId");
  const dateIssue = validateTimestamp(input.expiresAt, "expiresAt");
  const scope = input.scope;

  if (projectIssue) {
    issues.push(projectIssue);
  }
  if (dateIssue) {
    issues.push(dateIssue);
  }
  if (!isSupportedApiKeyScope(scope)) {
    issues.push({
      field: "scope",
      code: "unsupported-value",
      message: "scope must be one of: release:read.",
    });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    value: {
      projectId: input.projectId as string,
      expiresAt: input.expiresAt as string,
      scope: scope as CreateApiKeyRequest["scope"],
    },
  };
}

export function parseRevokeApiKeyRequest(
  input: unknown,
): ValidationResult<RevokeApiKeyRequest> {
  if (!isRecord(input)) {
    return invalidRequestBody();
  }

  const issues = collectUnknownFields(input, REVOKE_API_KEY_FIELDS);
  for (const field of ["projectId", "apiKeyId"] as const) {
    const issue = validateIdentifierField(input[field], field);
    if (issue) {
      issues.push(issue);
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    value: {
      projectId: input.projectId as string,
      apiKeyId: input.apiKeyId as string,
    },
  };
}
