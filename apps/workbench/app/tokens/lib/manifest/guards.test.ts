import { isSupportedTokenKind } from "@repo/contracts/token-kind";
import { describe, expect, it } from "vitest";
import { asString, asStringArray, toId } from "./guards";

describe("guards", () => {
  it("asString returns trimmed string for valid input", () => {
    expect(asString("  primary  ")).toBe("primary");
  });

  it("asString returns undefined for non string input", () => {
    expect(asString(42)).toBeUndefined();
    expect(asString(null)).toBeUndefined();
    expect(asString(undefined)).toBeUndefined();
    expect(asString({})).toBeUndefined();
  });

  it("asStringArray returns only valid strings", () => {
    expect(asStringArray(["  a", "b ", 10, null, undefined, "  ", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("isSupportedTokenKind accepts primitive/semantic and rejects class-union", () => {
    expect(isSupportedTokenKind("primitive")).toBe(true);
    expect(isSupportedTokenKind("semantic")).toBe(true);
    expect(isSupportedTokenKind("class-union")).toBe(false);
  });

  it("toId returns the same string with identical input", () => {
    const input1 = toId("color", "primary *^--background");
    const input2 = toId("color", "primary *^--background");

    expect(input1).toEqual(input2);
    expect(input1).toEqual("color:primary-background");
  });
});
