const REDACTED = "[REDACTED]";

const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordHash",
  "secret",
  "keyHash",
  "authorization",
  "cookie",
  "sessionId",
]);

export function redactSensitiveFields(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      SENSITIVE_FIELDS.has(key) ? REDACTED : fieldValue,
    ]),
  );
}
