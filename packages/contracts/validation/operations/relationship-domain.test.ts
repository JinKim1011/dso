import {
  baseColorToken,
  baseColorType,
  semanticColorType,
  surfaceToken,
} from "@repo/contracts/fixtures/domain-contracts";
import { addReferenceRequest } from "@repo/contracts/fixtures/operation-contracts";
import {
  validateAddReferenceOperation,
  validateChangeParentOperation,
} from "@repo/contracts/validation/operations/relationship-domain";
import { describe, expect, it } from "vitest";

const request = addReferenceRequest;
const primitiveType = baseColorType;
const semanticType = semanticColorType;
const singleValue = baseColorToken;
const modesValue = surfaceToken;

describe("validateAddReferenceOperation", () => {
  it("converts an operation request into a valid token reference", () => {
    const errors = validateAddReferenceOperation(
      request,
      [modesValue, singleValue],
      [semanticType, primitiveType],
    );

    expect(errors).toEqual([]);
  });
});

describe("validateChangeParentOperation", () => {
  it("rejects a parent change that creates a cycle", () => {
    const tokenTypes = [semanticType, primitiveType];

    const errors = validateChangeParentOperation(
      {
        projectId: "project-1",
        tokenTypeId: "token-type-base",
        parentTypeId: "token-type-semantic",
      },
      tokenTypes,
    );

    expect(errors.some((error) => error.code === "cycle")).toBe(true);
  });
});
