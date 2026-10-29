import { validateIdentifierString } from "@repo/contracts/validation/identifier";
import { validateMaxLength } from "@repo/contracts/validation/limit";
import { validateRequiredString } from "@repo/contracts/validation/required";

export type ValidationIssue = {
  field: string;
  code:
    | "invalid-type"
    | "required"
    | "empty"
    | "invalid-format"
    | "unsafe-character"
    | "unsupported-value"
    | "unknown-field"
    | "too-long"
    | "too-many-items";
  message: string;
};

export type ValidationResult<T> =
  { success: true; value: T } | { success: false; issues: ValidationIssue[] };

function mapIdentifierErrorCode(
  code: "not-string" | "empty" | "unsafe-character" | "too-long" | "invalid-segment",
): ValidationIssue["code"] {
  switch (code) {
    case "not-string":
      return "invalid-type";
    case "empty":
      return "empty";
    case "unsafe-character":
      return "unsafe-character";
    case "invalid-segment":
      return "invalid-format";
    case "too-long":
      return "too-long";
  }
}

function mapRequiredStringErrorCode(
  code: "not-string" | "empty" | "unsafe-character",
): ValidationIssue["code"] {
  switch (code) {
    case "not-string":
      return "invalid-type";
    case "empty":
      return "empty";
    case "unsafe-character":
      return "unsafe-character";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function collectUnknownFields(
  value: Record<string, unknown>,
  allowedFields: readonly string[],
): ValidationIssue[] {
  const allowed = new Set(allowedFields);

  return Object.keys(value)
    .filter((field) => !allowed.has(field))
    .map((field) => ({
      field,
      code: "unknown-field" as const,
      message: `Unknown field "${field}".`,
    }));
}

export function validateIdentifierField(
  value: unknown,
  field: string,
): ValidationIssue | null {
  const error = validateIdentifierString(value, field);

  if (!error) {
    return null;
  }

  return {
    field,
    code: mapIdentifierErrorCode(error.code),
    message: error.message,
  };
}

export function validateLimitedStringField(
  value: unknown,
  field: string,
  maximum: number,
): ValidationIssue | null {
  const result = validateRequiredString(value, field);

  if (!result.success) {
    return {
      field,
      code: mapRequiredStringErrorCode(result.error.code),
      message: result.error.message,
    };
  }

  const lengthError = validateMaxLength(result.value, field, maximum);

  if (!lengthError) {
    return null;
  }

  return {
    field,
    code: "too-long",
    message: lengthError.message,
  };
}

export function invalidRequestBody(): ValidationResult<never> {
  return {
    success: false,
    issues: [
      {
        field: "",
        code: "invalid-type",
        message: "Request body must be an object.",
      },
    ],
  };
}
