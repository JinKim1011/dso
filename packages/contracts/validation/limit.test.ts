import {
  CONTRACT_LIMITS,
  validateCollectionSize,
} from "@repo/contracts/validation/limit";
import { describe, expect, it } from "vitest";

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
