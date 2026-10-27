export type RequiredStringError = {
  code: "not-string" | "empty" | "unsafe-character";
  message: string;
};

export function validateRequiredString(
  value: unknown,
  fieldName: string,
): RequiredStringError | null {
  if (typeof value !== "string") {
    return {
      code: "not-string",
      message: `${fieldName} must be a string.`,
    };
  }

  if (value.trim().length === 0) {
    return {
      code: "empty",
      message: `${fieldName} cannot be empty.`,
    };
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return {
      code: "unsafe-character",
      message: `${fieldName} contains an unsafe control character.`,
    };
  }

  return null;
}
