import {
  baseColorToken,
  baseColorType,
  semanticColorType,
  surfaceToken,
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
      [surfaceToken, baseColorToken],
      [semanticColorType, baseColorType],
    );

    expect(errors).toEqual([]);
  });
});

describe("validateChangeParentOperation", () => {
  it("rejects a parent change that creates a cycle", () => {
    const errors = validateChangeParentOperation(
      {
        ...changeParentRequest,
        tokenTypeId: baseColorType.id,
        parentTypeId: semanticColorType.id,
      },
      [semanticColorType, baseColorType],
    );

    expect(errors.some((error) => error.code === "cycle")).toBe(true);
  });
});
