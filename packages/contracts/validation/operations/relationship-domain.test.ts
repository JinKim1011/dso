import {
  baseColorToken,
  baseColorType,
  semanticColorType,
  surfaceToken,
} from "@repo/contracts/fixtures/domain-contracts";
import { addReferenceRequest } from "@repo/contracts/fixtures/operation-contracts";
import { validateAddReferenceOperation } from "@repo/contracts/validation/operations/relationship-domain";
import { describe, expect, it } from "vitest";

describe("validateAddReferenceOperation", () => {
  it("converts an operation request into a valid token reference", () => {
    const request = addReferenceRequest;
    const primitiveType = baseColorType;
    const semanticType = semanticColorType;
    const singleValue = baseColorToken;
    const modesValue = surfaceToken;

    const errors = validateAddReferenceOperation(
      request,
      [modesValue, singleValue],
      [semanticType, primitiveType],
    );

    expect(errors).toEqual([]);
  });
});
