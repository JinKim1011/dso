import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import type { ValidationIssue } from "@repo/contracts/validation/operations/common";

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
