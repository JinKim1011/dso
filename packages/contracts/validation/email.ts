import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  type ValidationIssue,
  validateLimitedStringField,
} from "@repo/contracts/validation/operations/common";

export function validateEmail(
  value: unknown,
  fieldName = "email",
  maximum = CONTRACT_LIMITS.email,
): ValidationIssue | null {
  const issue = validateLimitedStringField(value, fieldName, maximum);

  if (issue || typeof value !== "string") {
    return issue;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return {
      field: fieldName,
      code: "invalid-format",
      message: `${fieldName} must be a valid email address.`,
    };
  }

  return null;
}
