import type { TokenType, TokenValue } from "@repo/contracts/type";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  type ValidationIssue,
  isRecord,
  validateLimitedStringField,
} from "@repo/contracts/validation/operations/common";
import { isTokenFunction, tokenize } from "@csstools/css-tokenizer";

export function hasTokenValueKind(value: unknown): value is { kind: string } {
  return isRecord(value) && typeof value.kind === "string";
}

export function containsCssVariable(value: string): boolean {
  return (
    /\bvar\s*\(/i.test(value) ||
    tokenize({ css: value }).some(
      (token) => isTokenFunction(token) && token[4].value.toLowerCase() === "var",
    )
  );
}

export function validatePrimitiveTokenValue(value: TokenValue): ValidationIssue[] {
  if (value.kind === "single" && containsCssVariable(value.value)) {
    return [
      {
        field: "value.value",
        code: "unsupported-value",
        message: "Primitive token values cannot contain CSS var() functions.",
      },
    ];
  }
  return [];
}

export function expectedValueKind(
  tokenType: TokenType,
): "single" | "modes" | "typography" | null {
  if (tokenType.category === "color" || tokenType.category === "shadow") {
    return tokenType.kind === "primitive" ? "single" : "modes";
  }

  if (tokenType.category === "typography") {
    return tokenType.kind === "primitive" ? "single" : "typography";
  }

  if (
    tokenType.category === "spacing" ||
    tokenType.category === "radius" ||
    tokenType.category === "motion"
  ) {
    return "single";
  }

  return null;
}

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
    case "typography":
      if (Object.keys(value).some((field) => field !== "kind")) {
        issues.push({
          field: "value",
          code: "unknown-field",
          message: "Semantic slots must be represented by token references.",
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
