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
