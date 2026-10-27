import {
  type MaxLengthError,
  CONTRACT_LIMITS,
  validateMaxLength,
} from "@repo/contracts/validation/limit";
import {
  type RequiredStringError,
  validateRequiredString,
} from "@repo/contracts/validation/required";

export type IdentifierStringError = {
  code: "invalid-segment";
  message: string;
};

export function validateIdentifierString(
  value: unknown,
  fieldName: string,
  maximum = CONTRACT_LIMITS.identifier,
): RequiredStringError | MaxLengthError | IdentifierStringError | null {
  const requiredError = validateRequiredString(value, fieldName);

  if (requiredError) {
    return requiredError;
  }

  if (typeof value !== "string") {
    return {
      code: "not-string",
      message: `${fieldName} must be a string.`,
    };
  }

  const lengthError = validateMaxLength(value, fieldName, maximum);

  if (lengthError) {
    return lengthError;
  }

  if (value.includes("/") || value.includes("\\")) {
    return {
      code: "invalid-segment",
      message: `${fieldName} cannot contain path separators.`,
    };
  }

  return null;
}
