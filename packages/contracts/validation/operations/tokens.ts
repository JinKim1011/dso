import type { UpdateTokenRequest } from "@repo/contracts/operation";
import { TokenValue } from "@repo/contracts/type";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  type ValidationResult,
  collectUnknownFields,
  invalidRequestBody,
  isRecord,
  validateIdentifierField,
  validateLimitedStringField,
} from "@repo/contracts/validation/operations/common";
import { validateTokenValue } from "@repo/contracts/validation/token-value";

const UPDATE_TOKEN_FIELDS = [
  "projectId",
  "tokenId",
  "name",
  "cssVar",
  "value",
] as const satisfies readonly (keyof UpdateTokenRequest)[];

export function parseUpdateTokenRequest(
  input: unknown,
): ValidationResult<UpdateTokenRequest> {
  if (!isRecord(input)) {
    return invalidRequestBody();
  }

  const issues = collectUnknownFields(input, UPDATE_TOKEN_FIELDS);
  for (const field of ["projectId", "tokenId"] as const) {
    const issue = validateIdentifierField(input[field], field);
    if (issue) {
      issues.push(issue);
    }
  }

  for (const [field, maximum] of [["name", CONTRACT_LIMITS.tokenName]] as const) {
    const issue = validateLimitedStringField(input[field], field, maximum);
    if (issue) {
      issues.push(issue);
    }
  }

  if (input.cssVar !== null) {
    const issue = validateLimitedStringField(
      input.cssVar,
      "cssVar",
      CONTRACT_LIMITS.cssVariable,
    );
    if (issue) {
      issues.push(issue);
    }
  }

  issues.push(...validateTokenValue(input.value));

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    value: {
      projectId: input.projectId as string,
      tokenId: input.tokenId as string,
      name: input.name as string,
      cssVar: input.cssVar as string | null,
      value: input.value as TokenValue,
    },
  };
}
