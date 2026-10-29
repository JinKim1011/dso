export type SeedValidationError = {
  code:
    | "too-many-items"
    | "duplicate-id"
    | "missing-record"
    | "wrong-project"
    | "invalid-reference"
    | "invalid-hierarchy"
    | "invalid-document-path"
    | "invalid-field"
    | "invalid-enum"
    | "invalid-timestamp";
  collection: string;
  id?: string;
  field?: string;
  message: string;
};
