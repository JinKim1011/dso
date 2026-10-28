import { validateMaxLength } from "@repo/contracts/validation/limit";
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
    });
  });
});
