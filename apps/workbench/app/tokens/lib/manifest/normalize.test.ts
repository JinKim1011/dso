import { describe, expect, it } from "vitest";
import { normalizeEntry } from "./normalize";

describe("normalize.normalizeEntry", () => {
  it("returns null when required fields are missing", () => {
    const missingCategory = {
      type: "background",
      kind: "primitive",
      value: ["primary", "secondary", "tertiary"],
    };
    const missingType = {
      category: "color",
      kind: "primitive",
      value: ["primary", "secondary", "tertiary"],
    };
    const missingKind = {
      category: "color",
      type: "background",
      value: ["primary", "secondary", "tertiary"],
    };
    const missingValue = {
      category: "color",
      type: "background",
      kind: "primitive",
    };

    expect(normalizeEntry(missingCategory)).toBeNull();
    expect(normalizeEntry(missingType)).toBeNull();
    expect(normalizeEntry(missingKind)).toBeNull();
    expect(normalizeEntry(missingValue)).toBeNull();
  });
});
