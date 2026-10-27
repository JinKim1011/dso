import { validateIdentifierString } from "@repo/contracts/validation/identifier";
import { describe, expect, it } from "vitest";

describe("validateIdentifierString", () => {
  it("accepts a valid identifier", () => {
    expect(validateIdentifierString("project-1", "Project ID")).toBeNull();
  });

  it("rejects path separators", () => {
    expect(validateIdentifierString("project/1", "Project ID")?.code).toBe(
      "invalid-segment",
    );
  });

  it("rejects identifiers that are too long", () => {
    expect(validateIdentifierString("a".repeat(129), "Project ID"))?.toMatchObject({
      code: "too-long",
    });
  });
});
