import { describe, expect, it } from "vitest";
import happyManifest from "./fixtures/happy-manifest.json";
import semanticTypographyManifest from "./fixtures/semantic-typography-manifest.json";
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
    const result = normalizeEntry(raw);

    if (!raw) throw new Error("Expected happy manifest row");
    if (!result) throw new Error("Expected normalized result");
    if (!result.tokens) throw new Error("Expected tokens");

    const tokens = result.tokens;
    expect(tokens.length).toBe(raw.tokens.length);

    const normalized_0 = tokens[0];
    const raw_0 = raw.tokens[0];

    if (!normalized_0) throw new Error("Expected first normalized token");
    if (!raw_0) throw new Error("Expected first raw token");

    expect(normalized_0.name).toBe(raw_0.name);
    expect(normalized_0.cssVar).toBe(raw_0.cssVar);
  });

  it("keeps semanticMap when valid raw provided", () => {
    const raw = semanticTypographyManifest[0];
    const result = normalizeEntry(raw);

    if (!raw) throw new Error("Expected semanticTypography manifest row");
    if (!result) throw new Error("Expected normalized result");
    if (!result.semanticMap) throw new Error("Expected SemanticMap");

    const semanticMap = result.semanticMap;
    expect(semanticMap.length).toBe(raw.semanticMap.length);

    const normalized_0 = semanticMap[0];
    const raw_0 = raw.semanticMap[0];

    if (!normalized_0) throw new Error("Expected first normalized semanticMap");
    if (!raw_0) throw new Error("Expected first raw semanticMap");

    expect(normalized_0.name).toBe(raw_0.name);
    expect(normalized_0.fontSize).toBe(raw_0.fontSize);
    expect(normalized_0.fontWeight).toBe(raw_0.fontWeight);
    expect(normalized_0.lineHeight).toBe(raw_0.lineHeight);
  });
});
