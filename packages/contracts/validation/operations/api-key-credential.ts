import type {
  ValidationIssue,
  ValidationResult,
} from "@repo/contracts/validation/operations/common";

export type ApiKeyCredential = {
  keyIdentifier: string;
  secret: string;
};

const API_KEY_PREFIX = "dso_";
const API_KEY_CREDENTIAL_PATTERN = /^dso_([0-9a-f]{16})_([A-Za-z0-9_-]{43})$/;

function invalidCredential(
  code: ValidationIssue["code"],
  message: string,
): ValidationResult<never> {
  return {
    success: false,
    issues: [{ field: "credential", code, message }],
  };
}

export function parseApiKeyCredential(
  input: unknown,
): ValidationResult<ApiKeyCredential> {
  if (typeof input !== "string") {
    return invalidCredential("invalid-type", "credential must be a string.");
  }

  if (input.trim().length === 0) {
    return invalidCredential("empty", "credential cannot be empty.");
  }

  if (/[\u0000-\u001F\u007F]/.test(input)) {
    return invalidCredential(
      "unsafe-character",
      "credential contains an unsafe control character.",
    );
  }

  if (!input.startsWith(API_KEY_PREFIX)) {
    return invalidCredential(
      "unsupported-value",
      `credential must start with "${API_KEY_PREFIX}".`,
    );
  }

  const match = API_KEY_CREDENTIAL_PATTERN.exec(input);

  if (!match) {
    return invalidCredential(
      "invalid-format",
      "credential must match dso_<16-digit-hex-identifier>_<32-byte-base64url-secret>.",
    );
  }

  return {
    success: true,
    value: {
      keyIdentifier: match[1]!,
      secret: match[2]!,
    },
  };
}
