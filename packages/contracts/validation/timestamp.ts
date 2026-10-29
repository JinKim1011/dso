import { type ValidationIssue } from "@repo/contracts/validation/operations/common";

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

  if (Number.isNaN(Date.parse(value))) {
    return {
      field: fieldName,
      code: "invalid-format",
      message: `${fieldName} must be a valid ISO-8601 date.`,
    };
  }

  return null;
}
