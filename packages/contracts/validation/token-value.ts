import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  type ValidationIssue,
  isRecord,
  validateLimitedStringField,
} from "@repo/contracts/validation/operations/common";

export function validateTokenValue(value: unknown): ValidationIssue[] {
  if (!isRecord(value)) {
    return [
      {
        field: "value",
        code: "invalid-type",
        message: "value must be an object.",
      },
    ];
  }

  if (typeof value.kind !== "string") {
    return [
      {
        field: "value.kind",
        code: "invalid-type",
        message: "value.kind must be a string.",
      },
    ];
  }

  const issues: ValidationIssue[] = [];
  const validateValueField = (field: string) => {
    const issue = validateLimitedStringField(
      value[field],
      `value.${field}`,
      CONTRACT_LIMITS.tokenValue,
      { allowWhitespaceControls: true },
    );

    if (issue) {
      issues.push(issue);
    }
  };

  switch (value.kind) {
    case "single":
      if (Object.keys(value).some((field) => !["kind", "value"].includes(field))) {
        issues.push({
          field: "value",
          code: "unknown-field",
          message: "value contains an unknown field.",
        });
      }
      validateValueField("value");
      break;
    case "modes":
      for (const field of ["light", "dark"] as const) {
        if (field in value) {
          validateValueField(field);
        }
      }
      if (
        Object.keys(value).some((field) => !["kind", "light", "dark"].includes(field))
      ) {
        issues.push({
          field: "value",
          code: "unknown-field",
          message: "value contains an unknown field.",
        });
      }
      break;
    case "typography":
      for (const field of ["fontSize", "fontWeight", "lineHeight"] as const) {
        validateValueField(field);
      }
      if (
        Object.keys(value).some(
          (field) => !["kind", "fontSize", "fontWeight", "lineHeight"].includes(field),
        )
      ) {
        issues.push({
          field: "value",
          code: "unknown-field",
          message: "value contains an unknown field.",
        });
      }
      break;
    case "unresolved":
      if (Object.keys(value).length !== 1) {
        issues.push({
          field: "value",
          code: "unknown-field",
          message: "unresolved value cannot contain additional fields.",
        });
      }
      break;
    default:
      issues.push({
        field: "value.kind",
        code: "unsupported-value",
        message: "value.kind must be one of: single, modes, typography, unresolved.",
      });
  }

  return issues;
}
