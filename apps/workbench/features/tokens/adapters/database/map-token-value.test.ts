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
        meta: "light:#fff dark:-",
        preview: {
          kind: "modes",
          light: "#fff",
          dark: undefined,
        },
      },
    );
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
