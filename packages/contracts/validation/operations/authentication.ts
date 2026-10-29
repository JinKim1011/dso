import type { LoginRequest } from "@repo/contracts/operation";
import { validateEmail } from "@repo/contracts/validation/email";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  type ValidationResult,
  collectUnknownFields,
  invalidRequestBody,
  isRecord,
  validateLimitedStringField,
} from "@repo/contracts/validation/operations/common";

const LOGIN_FIELDS = [
  "email",
  "password",
] as const satisfies readonly (keyof LoginRequest)[];

export function parseLoginRequest(input: unknown): ValidationResult<LoginRequest> {
  if (!isRecord(input)) {
    return invalidRequestBody();
  }

  const issues = collectUnknownFields(input, LOGIN_FIELDS);
  const emailIssue = validateEmail(input.email);
  const passwordIssue = validateLimitedStringField(
    input.password,
    "password",
    CONTRACT_LIMITS.password,
  );

  if (emailIssue) {
    issues.push(emailIssue);
  }
  if (passwordIssue) {
    issues.push(passwordIssue);
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    value: { email: input.email as string, password: input.password as string },
  };
}
