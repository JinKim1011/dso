import { isRecord } from "@repo/contracts/validation/operations/common";
import { invalidEnvelope } from "@repo/release-protocol/envelope-fields";

export function hasExactFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const actual = Object.keys(value);
  return (
    actual.length === fields.length && actual.every((field) => fields.includes(field))
  );
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function requireString(
  value: Record<string, unknown>,
  field: string,
  name: string,
): void {
  if (typeof value[field] !== "string") {
    invalidEnvelope(`${name}.${field} must be a string.`);
  }
}

export function requireNullableString(
  value: Record<string, unknown>,
  field: string,
  name: string,
): void {
  if (value[field] !== null && typeof value[field] !== "string") {
    invalidEnvelope(`${name}.${field} must be a string or null.`);
  }
}

export function requireArray(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value)) {
    return invalidEnvelope(`${name} must be an array.`);
  }
  return value;
}

export function requireRecord(
  value: unknown,
  fields: readonly string[],
  name: string,
): Record<string, unknown> {
  if (!isRecord(value) || !hasExactFields(value, fields)) {
    return invalidEnvelope(`${name} has invalid fields.`);
  }
  return value;
}

export function assertUniqueIds(
  records: readonly Record<string, unknown>[],
  name: string,
): void {
  const ids = new Set<string>();
  for (const record of records) {
    const id = record.id;
    if (!isNonEmptyString(id)) {
      invalidEnvelope(`${name}.id must be a non-empty string.`);
    }
    if (ids.has(id)) {
      invalidEnvelope(`${name} contains duplicate id "${id}".`);
    }
    ids.add(id);
  }
}
