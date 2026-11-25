import { validateSeedData } from "@repo/contracts/validation/seed";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

describe("validSeed", () => {
  it("is a valid complete seed", () => {
    expect(validateSeedData(validSeed)).toEqual([]);
  });

  it("contains unique IDs", () => {
    const ids = [
      ...validSeed.users.map(({ id }) => id),
      ...validSeed.projects.map(({ id }) => id),
      ...validSeed.tokenTypes.map(({ id }) => id),
      ...validSeed.tokens.map(({ id }) => id),
      ...validSeed.components.map(({ id }) => id),
      ...validSeed.documentTemplates.map(({ id }) => id),
      ...validSeed.releases.map(({ id }) => id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stores semantic mode and typography slots only as references", () => {
    const tokens = validSeed.tokens.filter(
      (token) => token.value.kind === "modes" || token.value.kind === "typography",
    );
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) {
      expect(token.value).toEqual({ kind: token.value.kind });
      expect(
        validSeed.tokenReferences.some(
          (reference) => reference.referencingTokenId === token.id,
        ),
      ).toBe(true);
    }
  });

  it("contains demo spacing primitives and semantic references", () => {
    const primitiveTypes = validSeed.tokenTypes.filter(
      (tokenType) => tokenType.category === "spacing" && tokenType.kind === "primitive",
    );
    const semanticTypes = validSeed.tokenTypes.filter(
      (tokenType) => tokenType.category === "spacing" && tokenType.kind === "semantic",
    );

    expect(primitiveTypes.map(({ name }) => name)).toEqual(["padding", "margin", "gap"]);
    expect(semanticTypes.map(({ name }) => name)).toEqual([
      "component",
      "layout",
      "inline",
    ]);

    for (const tokenType of primitiveTypes) {
      expect(
        validSeed.tokens
          .filter((token) => token.tokenTypeId === tokenType.id)
          .map((token) => token.name),
      ).toEqual(
        ["micro", "mini", "small", "regular", "large"].map(
          (name) => `${tokenType.name}-${name}`,
        ),
      );
    }

    const spacingReferences = validSeed.tokenReferences.filter(
      (reference) =>
        validSeed.tokens.find((token) => token.id === reference.referencingTokenId)
          ?.tokenTypeId &&
        validSeed.tokenTypes.find(
          (tokenType) =>
            tokenType.id ===
            validSeed.tokens.find((token) => token.id === reference.referencingTokenId)
              ?.tokenTypeId,
        )?.category === "spacing",
    );
    expect(spacingReferences).toHaveLength(15);
    expect(
      validSeed.tokens
        .filter((token) =>
          semanticTypes.some((tokenType) => tokenType.id === token.tokenTypeId),
        )
        .map((token) => token.name),
    ).toEqual([
      "component-inset-micro",
      "component-inset-mini",
      "component-inset-small",
      "component-inset-regular",
      "component-inset-large",
      "layout-section-gap-micro",
      "layout-section-gap-mini",
      "layout-section-gap-small",
      "layout-section-gap-regular",
      "layout-section-gap-large",
      "inline-item-gap-micro",
      "inline-item-gap-mini",
      "inline-item-gap-small",
      "inline-item-gap-regular",
      "inline-item-gap-large",
    ]);
  });

  it("contains demo radius primitives and component semantic references", () => {
    const primitiveScale = validSeed.tokenTypes.find(
      (tokenType) =>
        tokenType.category === "radius" &&
        tokenType.kind === "primitive" &&
        tokenType.name === "scale",
    );
    expect(primitiveScale).toBeDefined();

    expect(
      validSeed.tokens
        .filter((token) => token.tokenTypeId === primitiveScale?.id)
        .map((token) => token.name),
    ).toEqual([
      "scale-none",
      "scale-micro",
      "scale-mini",
      "scale-small",
      "scale-regular",
      "scale-large",
      "scale-xlarge",
      "scale-2xlarge",
      "scale-full",
    ]);

    const component = validSeed.tokenTypes.find(
      (tokenType) =>
        tokenType.category === "radius" &&
        tokenType.kind === "semantic" &&
        tokenType.name === "component",
    );
    expect(component).toBeDefined();

    expect(
      validSeed.tokenTypes
        .filter(
          (tokenType) =>
            tokenType.category === "radius" &&
            tokenType.kind === "semantic" &&
            tokenType.parentTypeId === component?.id,
        )
        .map((tokenType) => tokenType.name),
    ).toEqual(["modal", "card", "button", "input-field"]);

    const radiusTypeIds = new Set(
      validSeed.tokenTypes
        .filter((tokenType) => tokenType.category === "radius")
        .map((tokenType) => tokenType.id),
    );
    const semanticRadiusTokenIds = new Set(
      validSeed.tokens
        .filter((token) => radiusTypeIds.has(token.tokenTypeId))
        .filter(
          (token) =>
            validSeed.tokenTypes.find((tokenType) => tokenType.id === token.tokenTypeId)
              ?.kind === "semantic",
        )
        .map((token) => token.id),
    );
    expect(
      validSeed.tokenReferences.filter((reference) =>
        semanticRadiusTokenIds.has(reference.referencingTokenId),
      ),
    ).toHaveLength(16);
    expect(
      validSeed.tokens
        .filter((token) => semanticRadiusTokenIds.has(token.id))
        .map((token) => token.name),
    ).toContain("input-field-corner-regular");
  });

  it("contains demo shadow elevations and light/dark semantic references", () => {
    const primitiveTypes = validSeed.tokenTypes.filter(
      (tokenType) => tokenType.category === "shadow" && tokenType.kind === "primitive",
    );

    expect(primitiveTypes.map(({ name }) => name)).toEqual([
      "light-elevation",
      "dark-elevation",
    ]);

    for (const tokenType of primitiveTypes) {
      const prefix = tokenType.name === "light-elevation" ? "light" : "dark";
      expect(
        validSeed.tokens
          .filter((token) => token.tokenTypeId === tokenType.id)
          .map((token) => token.name),
      ).toEqual(["mini", "small", "regular", "large"].map((name) => `${prefix}-${name}`));
    }

    const component = validSeed.tokenTypes.find(
      (tokenType) =>
        tokenType.category === "shadow" &&
        tokenType.kind === "semantic" &&
        tokenType.name === "component",
    );
    const layout = validSeed.tokenTypes.find(
      (tokenType) =>
        tokenType.category === "shadow" &&
        tokenType.kind === "semantic" &&
        tokenType.name === "layout",
    );

    expect(component).toBeDefined();
    expect(layout).toBeDefined();
    expect(
      validSeed.tokenTypes
        .filter(
          (tokenType) =>
            tokenType.category === "shadow" && tokenType.parentTypeId === component?.id,
        )
        .map((tokenType) => tokenType.name),
    ).toEqual(["modal", "card"]);
    expect(
      validSeed.tokenTypes
        .filter(
          (tokenType) =>
            tokenType.category === "shadow" && tokenType.parentTypeId === layout?.id,
        )
        .map((tokenType) => tokenType.name),
    ).toEqual(["sidebar", "header"]);

    const shadowTypeIds = new Set(
      validSeed.tokenTypes
        .filter((tokenType) => tokenType.category === "shadow")
        .map((tokenType) => tokenType.id),
    );
    const semanticShadowTokenIds = new Set(
      validSeed.tokens
        .filter((token) => shadowTypeIds.has(token.tokenTypeId))
        .filter(
          (token) =>
            validSeed.tokenTypes.find((tokenType) => tokenType.id === token.tokenTypeId)
              ?.kind === "semantic",
        )
        .map((token) => token.id),
    );
    const shadowReferences = validSeed.tokenReferences.filter((reference) =>
      semanticShadowTokenIds.has(reference.referencingTokenId),
    );

    expect(shadowReferences).toHaveLength(32);
    expect(shadowReferences.filter(({ slot }) => slot === "light")).toHaveLength(16);
    expect(shadowReferences.filter(({ slot }) => slot === "dark")).toHaveLength(16);
    expect(
      validSeed.tokens
        .filter((token) => semanticShadowTokenIds.has(token.id))
        .map((token) => token.name),
    ).toContain("modal-elevation-large");
  });
});
