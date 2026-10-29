import type { ValidationIssue } from "@repo/contracts/validation/operations/common";

export function validateTimestamp(
  value: unknown,
  fieldName: string,
): ValidationIssue | null {
  if (typeof value !== "string") {
    return {
      field: fieldName,
      code: "invalid-type",
      message: `${fieldName} must be a string.`,
    };
  }

  const ISO_TIMESTAMP_RE =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(?:Z|[+-]\d{2}:\d{2})$/;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (
    !ISO_TIMESTAMP_RE.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    day < 1 ||
    day > (daysInMonth[month - 1] ?? 0)
  ) {
    return {
      field: fieldName,
      code: "invalid-format",
      message: `${fieldName} must be a valid ISO-8601 date.`,
    };
  }

  return null;
}
