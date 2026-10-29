export type RequiredStringError = {
  code: "not-string" | "empty" | "unsafe-character";
  message: string;
};

export type RequiredStringOptions = {
  allowWhitespaceControls?: boolean;
};

export type RequiredStringResult =
  { success: true; value: string } | { success: false; error: RequiredStringError };

export function validateRequiredString(
  value: unknown,
  fieldName: string,
  options: RequiredStringOptions = {},
): RequiredStringResult {
  if (typeof value !== "string") {
    return {
      success: false,
      error: {
        code: "not-string",
        message: `${fieldName} must be a string.`,
      },
    };
  }

  if (value.trim().length === 0) {
    return {
      success: false,
      error: {
        code: "empty",
        message: `${fieldName} cannot be empty.`,
      },
    };
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return {
      success: false,
      error: {
        code: "unsafe-character",
        message: `${fieldName} contains an unsafe control character.`,
      },
    };
  }

  return {
    success: true,
    value,
  };
}
