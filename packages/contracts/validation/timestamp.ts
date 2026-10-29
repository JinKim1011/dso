import type { ValidationIssue } from "@repo/contracts/validation/operations/common";

export function validateTimestamp(
  value: unknown,
  fieldName: string,
): ValidationIssue | null {
  if (typeof value !== "string") {
    return {
      field: fieldName,
      code: "invalid-type",
      message: `${fieldName} must be a string.`,
    };
  }

  const ISO_TIMESTAMP_RE =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(?:Z|[+-]\d{2}:\d{2})$/;

  if (!ISO_TIMESTAMP_RE.test(value) || Number.isNaN(Date.parse(value))) {
    return {
      field: fieldName,
      code: "invalid-format",
      message: `${fieldName} must be a valid ISO-8601 date.`,
    };
  }

  return null;
}
