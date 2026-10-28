import type {
  AddTokenReferenceRequest,
  ChangeTokenTypeParentRequest,
} from "@repo/contracts/operation";
import type { TokenReferenceSlot } from "@repo/contracts/type";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  ValidationIssue,
  type ValidationResult,
  collectUnknownFields,
  isRecord,
  validateIdentifierField,
} from "@repo/contracts/validation/operations/common";
import { tokenReferenceSlots } from "@repo/contracts/validation/token-reference-slots";

const ADD_REFERENCE_FIELDS = [
  "projectId",
  "referencingTokenId",
  "referencedTokenId",
  "slot",
] as const satisfies readonly (keyof AddTokenReferenceRequest)[];

const CHANGE_PARENT_FIELDS = [
  "projectId",
  "tokenTypeId",
  "parentTypeId",
] as const satisfies readonly (keyof ChangeTokenTypeParentRequest)[];

export function parseAddTokenReferenceRequest(
  input: unknown,
): ValidationResult<AddTokenReferenceRequest> {
  if (!isRecord(input)) {
    return {
      success: false,
      issues: [
        {
          field: "",
          code: "invalid-type",
          message: "Request body must be an object",
        },
      ],
    };
  }

  const issues = collectUnknownFields(input, ADD_REFERENCE_FIELDS);

  for (const field of ["projectId", "referencingTokenId", "referencedTokenId"] as const) {
    const issue = validateIdentifierField(input[field], field);

    if (issue) {
      issues.push(issue);
    }
  }

  if (
    typeof input.slot !== "string" ||
    !tokenReferenceSlots.includes(input.slot as TokenReferenceSlot)
  ) {
    issues.push({
      field: "slot",
      code: "unsupported-value",
      message: `slot must be one of: ${tokenReferenceSlots.join(", ")}.`,
    });
  }

  if (issues.length > 0) {
    return {
      success: false,
      issues,
    };
  }

  return {
    success: true,
    value: {
      projectId: input.projectId as string,
      referencingTokenId: input.referencingTokenId as string,
      referencedTokenId: input.referencedTokenId as string,
      slot: input.slot as TokenReferenceSlot,
    },
  };
}

export function parseChangeTokenTypeParentRequest(
  input: unknown,
): ValidationResult<ChangeTokenTypeParentRequest> {
  if (!isRecord(input)) {
    return {
      success: false,
      issues: [
        {
          field: "",
          code: "invalid-type",
          message: "Request body must be an object.",
        },
      ],
    };
  }

  const issues = collectUnknownFields(input, CHANGE_PARENT_FIELDS);

  for (const field of ["projectId", "tokenTypeId"] as const) {
    const issue = validateIdentifierField(input[field], field);

    if (issue) {
      issues.push(issue);
    }
  }

  if (input.parentTypeId !== null) {
    const issue = validateIdentifierField(input.parentTypeId, "parentTypeId");

    if (issue) {
      issues.push(issue);
    }
  }

  if (issues.length > 0) {
    return {
      success: false,
      issues,
    };
  }

  return {
    success: true,
    value: {
      projectId: input.projectId as string,
      tokenTypeId: input.tokenTypeId as string,
      parentTypeId: input.parentTypeId as string | null,
    },
  };
}

export function validateRequestBodySize(
  body: string | Uint8Array,
): ValidationIssue | null {
  const size =
    typeof body === "string"
      ? new TextEncoder().encode(body).byteLength
      : body.byteLength;

  if (size > CONTRACT_LIMITS.requestBodyBytes) {
    return {
      field: "",
      code: "too-long",
      message: `Request body cannot exceed ${CONTRACT_LIMITS.requestBodyBytes} bytes.`,
    };
  }

  return null;
}
