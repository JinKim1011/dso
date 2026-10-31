import {
  baseColorToken,
  modeToken,
  primitiveTokenType,
  semanticTokenType,
} from "@repo/contracts/fixtures/domain-contracts";
import {
  addReferenceRequest,
  changeParentRequest,
} from "@repo/contracts/fixtures/operation-contracts";
import {
  validateAddReferenceOperation,
  validateChangeParentOperation,
} from "@repo/contracts/validation/operations/relationship-domain";
import { describe, expect, it } from "vitest";

describe("validateAddReferenceOperation", () => {
  it("converts an operation request into a valid token reference", () => {
    const errors = validateAddReferenceOperation(
      addReferenceRequest,
      [modeToken, baseColorToken],
      [semanticTokenType, primitiveTokenType],
    );

    expect(errors).toEqual([]);
  });
});

describe("validateChangeParentOperation", () => {
  it("rejects a parent change that creates a cycle", () => {
    const errors = validateChangeParentOperation(
      {
        ...changeParentRequest,
        tokenTypeId: primitiveTokenType.id,
        parentTypeId: semanticTokenType.id,
      },
      [semanticTokenType, primitiveTokenType],
    );

    expect(errors.some((error) => error.code === "cycle")).toBe(true);
  });
});
