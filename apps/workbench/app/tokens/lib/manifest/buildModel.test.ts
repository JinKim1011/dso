import { describe, expect, it } from "vitest";
import { buildTokenGraphModel } from "./buildModel";
import edgeInvalidManifest from "./fixtures/edge-invalid-manifest.json";
import happyManifest from "./fixtures/happy-manifest.json";
import semanticTypographyManifest from "./fixtures/semantic-typography-manifest.json";
import { DEFAULT_CATEGORY_ORDER } from "./types";

describe("buildModel.buildTokenGraphModel", () => {
  const happyResult = buildTokenGraphModel(happyManifest);
  const edgeResult = buildTokenGraphModel(edgeInvalidManifest);
  const semanticResult = buildTokenGraphModel(semanticTypographyManifest);

  it("creates root with expected id and label", () => {
    expect(happyResult.model.root.id).toBe("root");
    expect(happyResult.model.root.label).toBe("Design Tokens");
  });

  it("creates non-empty categories and tokenTypes", () => {
    expect(happyResult.model.categories.length).toBeGreaterThan(0);
    expect(happyResult.model.tokenTypes.length).toBeGreaterThan(0);

    expect(happyResult.model.categories.length).toEqual(2);
    expect(happyResult.model.tokenTypes.length).toEqual(2);
  });

  it("links category tokenTypeIds to tokenTypes in the same category", () => {
    const tokenTypesById = new Map(
      happyResult.model.tokenTypes.map((tokenType) => [tokenType.id, tokenType]),
    );

    for (const category of happyResult.model.categories) {
      for (const tokenTypeId of category.tokenTypeIds) {
        const tokenType = tokenTypesById.get(tokenTypeId);

        expect(tokenType).toBeDefined();
        expect(tokenType?.category).toBe(category.category);
      }
    }
  });

  it("keeps values inside tokenType.values", () => {
    expect(happyResult.model.tokenTypes).toBeInstanceOf(Array);
    expect(happyResult.model.tokenTypes.length).toBe(2);

    for (const tokenType of happyResult.model.tokenTypes) {
      expect(tokenType.values).toBeInstanceOf(Array);
      expect(tokenType.values.length).toBeGreaterThan(0);
    }
  });

  it("creates valid token value preview data", () => {
    const backgroudType = happyResult.model.tokenTypes.find(
      (tokenType) => tokenType.category === "color" && tokenType.type === "background",
    );
    const primaryColor = backgroudType?.values.find((value) => value.name === "primary");

    expect(backgroudType).toBeDefined();
    expect(primaryColor).toBeDefined();
    expect(primaryColor?.preview).toEqual({
      kind: "color",
      light: "oklch(1 0 89.9)",
      dark: "oklch(0.132 0.036 276.6)",
    });

    const stepType = happyResult.model.tokenTypes.find(
      (tokenType) => tokenType.category === "spacing" && tokenType.type === "step",
    );
    const microStep = stepType?.values.find((value) => value.name === "micro");

    expect(stepType).toBeDefined();
    expect(microStep).toBeDefined();
    expect(microStep?.preview).toEqual({
      kind: "spacing",
      value: "0.125rem",
    });

    const semanticKind = semanticResult.model.tokenTypes.find(
      (tokenType) => tokenType.kind === "semantic",
    );
    const bodyM = semanticKind?.values.find((value) => (value.name = "body-md"));
    expect(semanticKind).toBeDefined();
    expect(bodyM).toBeDefined();
    expect(bodyM?.preview).toEqual({
      kind: "typography",
      typography: {
        fontSize: "regular",
        fontWeight: "regular",
        lineHeight: "normal",
      },
    });
  });

  it("skips invalid rows and keeps the valid row", () => {
    expect(edgeResult.skippedCount).toBe(2);
    expect(edgeResult.model.tokenTypes.length).toBe(1);

    for (const tokenType of edgeResult.model.tokenTypes) {
      expect(tokenType.category).toBe("spacing");
      expect(tokenType.type).toBe("step");
      expect(tokenType.kind).toBe("primitive");
    }
  });

  it("orders categories by DEFAULT_CATEGORY_ORDER", () => {
    const actualOrder = happyResult.model.categories.map((category) => category.category);
    const expectedOrder = DEFAULT_CATEGORY_ORDER.filter((name) =>
      actualOrder.includes(name),
    );

    expect(expectedOrder).toEqual(actualOrder);
  });

  it("deterministic tokenType sorting", () => {
    const original = buildTokenGraphModel(happyManifest);
    const shuffledInput = [...happyManifest].reverse();
    const shuffled = buildTokenGraphModel(shuffledInput);

    const originalOrder = original.model.tokenTypes.map((tokenType) =>
      [tokenType.category, tokenType.type, tokenType.kind].join("|"),
    );
    const shuffledOrder = shuffled.model.tokenTypes.map((tokenType) =>
      [tokenType.category, tokenType.type, tokenType.kind].join("|"),
    );

    expect(originalOrder).toEqual(shuffledOrder);
    expect(originalOrder).toEqual([
      "color|background|primitive",
      "spacing|step|primitive",
    ]);
  });
});
