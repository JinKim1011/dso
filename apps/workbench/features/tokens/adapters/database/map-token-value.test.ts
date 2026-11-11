import type { Token, TokenType } from "@repo/contracts/type";
import { describe, expect, it } from "vitest";
import { createTokenReferenceLookup } from "./create-token-reference-lookup";
import { mapTokenValue } from "./map-token-value";

const token: Token = {
  id: "token",
  projectId: "project",
  tokenTypeId: "color-base",
  name: "sample",
  cssVar: "--sample",
  value: { kind: "single", value: "oklch(98.5% 0 0)" },
};
const colorType: TokenType = {
  id: token.tokenTypeId,
  projectId: token.projectId,
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
};
const lookup = createTokenReferenceLookup([], [], []);

describe("mapTokenValue", () => {
  it("maps a single color value with a preview", () => {
    expect(mapTokenValue(token, colorType, lookup)).toEqual({
      value: token.value,
      meta: "oklch(98.5% 0 0)",
      preview: {
        kind: "single",
        value: "oklch(98.5% 0 0)",
      },
    });
  });

  it("maps a single non-color value without a preview", () => {
    const singleToken: Token = {
      ...token,
      value: { kind: "single", value: "1rem" },
    };

    expect(
      mapTokenValue(singleToken, { ...colorType, category: "spacing" }, lookup),
    ).toEqual({
      value: singleToken.value,
      meta: "1rem",
      preview: undefined,
    });
  });

  it("maps mode values, including missing modes", () => {
    const modesToken: Token = {
      ...token,
      value: {
        kind: "modes",
        light: "#fff",
      },
    };

    expect(mapTokenValue(modesToken, { ...colorType, kind: "semantic" }, lookup)).toEqual(
      {
        value: modesToken.value,
        meta: "#fff / -",
        preview: {
          kind: "modes",
          light: "#fff",
          dark: undefined,
        },
      },
    );
  });

  it.each([
    [{ kind: "modes" as const }, undefined],
    [
      { kind: "modes" as const, light: "#fff" },
      { kind: "modes", light: "#fff" },
    ],
    [
      { kind: "modes" as const, dark: "#111" },
      { kind: "modes", dark: "#111" },
    ],
    [
      { kind: "modes" as const, light: "#fff", dark: "#111" },
      { kind: "modes", light: "#fff", dark: "#111" },
    ],
  ])("maps mode slots consistently: %o", (value, expected) => {
    const mapped = mapTokenValue(
      { ...token, value },
      { ...colorType, kind: "semantic" },
      lookup,
    );
    if (expected) {
      expect(mapped.preview).toMatchObject(expected);
    } else {
      expect(mapped.preview).toBeUndefined();
    }
  });

  it("preserves referenced token IDs while resolving mode previews", () => {
    const semanticType: TokenType = { ...colorType, id: "semantic", kind: "semantic" };
    const modesToken: Token = {
      ...token,
      id: "surface",
      tokenTypeId: semanticType.id,
      value: { kind: "modes", light: "var(--sample)", dark: "#111" },
    };
    const references = [
      {
        projectId: token.projectId,
        referencingTokenId: modesToken.id,
        referencedTokenId: token.id,
        slot: "light" as const,
      },
    ];
    const referenceLookup = createTokenReferenceLookup(
      [colorType, semanticType],
      [token, modesToken],
      references,
    );

    expect(mapTokenValue(modesToken, semanticType, referenceLookup)).toMatchObject({
      value: modesToken.value,
      references: { light: token.id },
      preview: { kind: "modes", light: "oklch(98.5% 0 0)", dark: "#111" },
    });
  });

  it("maps typography values", () => {
    const typographyToken: Token = {
      ...token,
      value: {
        kind: "typography",
        fontSize: "1rem",
        fontWeight: "400",
        lineHeight: "1.5",
      },
    };

    expect(
      mapTokenValue(
        typographyToken,
        { ...colorType, category: "typography", kind: "semantic" },
        lookup,
      ),
    ).toEqual({
      value: typographyToken.value,
      meta: "1rem / 400 / 1.5",
      preview: {
        kind: "typography",
        typography: {
          fontSize: "1rem",
          fontWeight: "400",
          lineHeight: "1.5",
        },
      },
    });
  });

  it("maps unresolved values", () => {
    const unresolvedToken: Token = {
      ...token,
      value: { kind: "unresolved" },
    };

    expect(mapTokenValue(unresolvedToken, colorType, lookup)).toEqual({
      value: unresolvedToken.value,
      meta: "unresolved",
    });
  });
});
