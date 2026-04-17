import { describe, expect, it } from "vitest";
import happyManifest from "./fixtures/happy-manifest.json";
import semanticTypographyManifest from "./fixtures/semantic-typography-manifest.json";
import { extractRows, normalizeEntry } from "./normalize";

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

  it("preserves single value and status", () => {
    const result = normalizeEntry(happyManifest[1]);

    if (!result) throw new Error("Expected normalized result");
    if (!result.tokens) throw new Error("Expected tokens");

    const tokens = result.tokens;
    const normalized_0 = tokens[0];

    if (!normalized_0) throw new Error("Expected first normalized token");

    expect(normalized_0.value).toBe("0.125rem");
    expect(normalized_0.status).toBe("matched");
  });

  it("preserves object values and status", () => {
    const result = normalizeEntry(happyManifest[0]);

    if (!result) throw new Error("Expected normalized result");
    if (!result.tokens) throw new Error("Expected tokens");

    const tokens = result.tokens;
    const normalized_0 = tokens[0];

    if (!normalized_0) throw new Error("Expected first normalized token");

    expect(normalized_0.values).toStrictEqual({
      light: "oklch(1 0 89.9)",
      dark: "oklch(0.132 0.036 276.6)",
    });
    expect(normalized_0.status).toStrictEqual({
      light: "matched",
      dark: "matched",
    });
  });
});

describe("normalize.extractRows", () => {
  it("extractRows supports array container", () => {
    const rows = extractRows(happyManifest);

    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(happyManifest.length);
    expect(rows[0]).toEqual(happyManifest[0]);
    expect(rows[1]).toEqual(happyManifest[1]);
  });
});
