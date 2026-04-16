import { describe, expect, it } from "vitest";
import happyManifest from "./fixtures/happy-manifest.json";
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

  it("keeps the tokens when valid raw provided", () => {
    const raw = happyManifest[0];
    if (!raw) throw new Error("Expected happy manifest row");

    const result = normalizeEntry(raw);
    if (!result) throw new Error("Expected normalized result");
    if (!result.tokens) throw new Error("Expected tokens");

    const tokens = result.tokens;
    expect(tokens.length).toBe(raw.tokens.length);

    const normalizedToken0 = tokens[0];
    const rawToken0 = raw.tokens[0];

    if (!normalizedToken0) throw new Error("Expected first normalized token");
    if (!rawToken0) throw new Error("Expected first raw token");

    expect(normalizedToken0.name).toBe(rawToken0.name);
    expect(normalizedToken0.cssVar).toBe(rawToken0.cssVar);
  });
});
