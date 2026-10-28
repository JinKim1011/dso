import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function fieldError(
  collection: string,
  id: string | undefined,
  field: string,
  message: string,
): SeedValidationError {
  return {
    code: "invalid-field",
    collection,
    id,
    field,
    message,
  };
}

export function missingRecordError(
  collection: string,
  id: string,
  field: string,
  message: string,
): SeedValidationError {
  return {
    code: "missing-record",
    collection,
    id,
    field,
    message,
  };
}

export function invalidEnumError(
  collection: string,
  id: string,
  field: string,
  message: string,
): SeedValidationError {
  return {
    code: "invalid-enum",
    collection,
    id,
    field,
    message,
  };
}
