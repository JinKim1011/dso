export type SeedValidationError = {
  code:
    | "too-many-items"
    | "duplicate-id"
    | "missing-record"
    | "wrong-project"
    | "invalid-reference"
    | "invalid-hierarchy"
    | "invalid-document-path";
  collection: string;
  id?: string;
  message: string;
};
