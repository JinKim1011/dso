import { validateMaxLength } from "@repo/contracts/validation/limit";
import { describe, expect, it } from "vitest";

describe("validateMaxLength", () => {
  it("accepts a value at the limit", () => {
    expect(validateMaxLength("abc", "Name", 3)).toBeNull();
  });

  it("rejects a value over the limit", () => {
    expect(validateMaxLength("abcd", "Name", 3)).toMatchObject({
      code: "too-long",
    });
  });
});
