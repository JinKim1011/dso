export type ValidationIssue = {
  field: string;
  code:
    | "invalid-type"
    | "required"
    | "empty"
    | "invalid-format"
    | "unsupported-value"
    | "unknown-field"
    | "too-long"
    | "too-many-items";
  message: string;
};

export type ValidationResult<T> =
  { success: true; value: T } | { success: false; issues: ValidationIssue[] };

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
