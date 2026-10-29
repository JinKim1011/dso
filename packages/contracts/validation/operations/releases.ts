import type {
  DownloadReleaseRequest,
  PublishReleaseRequest,
} from "@repo/contracts/operation";
import {
  type ValidationResult,
  collectUnknownFields,
  invalidRequestBody,
  isRecord,
  validateIdentifierField,
} from "@repo/contracts/validation/operations/common";

const PUBLISH_RELEASE_FIELDS = [
  "projectId",
  "releaseId",
] as const satisfies readonly (keyof PublishReleaseRequest)[];

const DOWNLOAD_RELEASE_FIELDS = [
  "releaseId",
] as const satisfies readonly (keyof DownloadReleaseRequest)[];

export function parsePublishReleaseRequest(
  input: unknown,
): ValidationResult<PublishReleaseRequest> {
  if (!isRecord(input)) {
    return invalidRequestBody();
  }

  const issues = collectUnknownFields(input, PUBLISH_RELEASE_FIELDS);
  for (const field of ["projectId", "releaseId"] as const) {
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
      releaseId: input.releaseId as string,
    },
  };
}

export function parseDownloadReleaseRequest(
  input: unknown,
): ValidationResult<DownloadReleaseRequest> {
  if (!isRecord(input)) {
    return invalidRequestBody();
  }

  const issues = collectUnknownFields(input, DOWNLOAD_RELEASE_FIELDS);
  const releaseIssue = validateIdentifierField(input.releaseId, "releaseId");
  if (releaseIssue) {
    issues.push(releaseIssue);
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    value: { releaseId: input.releaseId as string },
  };
}
