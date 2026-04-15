import { describe, expect, it } from "vitest";
import { asString, asStringArray, isSupportedKind } from "./guards";

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

  it("isSupportedKind accepts primitive/semantic and rejects class-union", () => {
    expect(isSupportedKind("primitive")).toBe(true);
    expect(isSupportedKind("semantic")).toBe(true);
    expect(isSupportedKind("class-union")).toBe(false);
  });
});
