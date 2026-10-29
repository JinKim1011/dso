import {
  CONTRACT_LIMITS,
  validateCollectionSize,
  validateStringLength,
} from "@repo/contracts/validation/limit";
import { describe, expect, it } from "vitest";

describe("validateStringLength", () => {
  it("accepts a string at the maximum length", () => {
    const value = "a".repeat(CONTRACT_LIMITS.tokenName);

    expect(validateStringLength(value, "name", CONTRACT_LIMITS.tokenName)).toBeNull();
  });

  it("rejects a string over the maximum length", () => {
    const value = "a".repeat(CONTRACT_LIMITS.tokenName + 1);

    expect(validateStringLength(value, "name", CONTRACT_LIMITS.tokenName)).toEqual({
      code: "too-long",
      message: `name cannot exceed ${CONTRACT_LIMITS.tokenName} characters.`,
    });
  });

  it("rejects non-string values", () => {
    expect(validateStringLength(123, "name", 10)).toEqual({
      code: "not-string",
      message: "name must be a string.",
    });
  });
});

describe("validateCollectionSize", () => {
  it("accepts exactly the maximum", () => {
    const items = Array.from({ length: 1_000 });

    expect(
      validateCollectionSize(items, "references", CONTRACT_LIMITS.collectionItems),
    ).toBeNull();
  });

  it("rejects one item over the maximum", () => {
    const items = Array.from({ length: 1_001 });

    expect(
      validateCollectionSize(items, "references", CONTRACT_LIMITS.collectionItems),
    ).toEqual({
      code: "too-many-items",
      message: "references cannot contain more than 1000 items.",
    });
  });
});
