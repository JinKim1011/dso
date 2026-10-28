import {
  CONTRACT_LIMITS,
  validateCollectionSize,
  validateMaxLength,
} from "@repo/contracts/validation/limit";
import { describe, expect, it } from "vitest";

describe("validateMaxLength", () => {
  it("accepts a value at the limit", () => {
    const value = "a".repeat(320);
    expect(validateMaxLength(value, "Email", CONTRACT_LIMITS.email)).toBeNull();
  });

  it("rejects a value over the limit", () => {
    const value = "a".repeat(321);
    expect(validateMaxLength(value, "Email", CONTRACT_LIMITS.email)).toMatchObject({
      code: "too-long",
      message: "Email cannot contain more than 320 characters.",
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
