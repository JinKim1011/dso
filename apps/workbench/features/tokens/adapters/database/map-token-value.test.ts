import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import type { Token } from "@repo/contracts/type";
import { describe, expect, it } from "vitest";
import { mapTokenValue } from "./map-token-value";

const token = validSeed.tokens[0]!;

describe("mapTokenValue", () => {
  it("maps a single color value with a preview", () => {
    expect(mapTokenValue(token, "color")).toEqual({
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

    expect(mapTokenValue(singleToken, "spacing")).toEqual({
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
        light: "var(--light)",
      },
    };

    expect(mapTokenValue(modesToken, "color")).toEqual({
      value: modesToken.value,
      meta: "light:var(--light) dark:-",
      preview: {
        kind: "modes",
        light: "var(--light)",
        dark: undefined,
      },
    });
  });

  it("maps typography values", () => {
    const typographyToken: Token = {
      ...token,
      value: {
        kind: "typography",
        fontSize: "var(--text-body)",
        fontWeight: "var(--font-regular)",
        lineHeight: "var(--leading-normal)",
      },
    };

    expect(mapTokenValue(typographyToken, "typography")).toEqual({
      value: typographyToken.value,
      meta: "var(--text-body) / var(--font-regular) / var(--leading-normal)",
      preview: {
        kind: "typography",
        typography: {
          fontSize: "var(--text-body)",
          fontWeight: "var(--font-regular)",
          lineHeight: "var(--leading-normal)",
        },
      },
    });
  });

  it("maps unresolved values", () => {
    const unresolvedToken: Token = {
      ...token,
      value: { kind: "unresolved" },
    };

    expect(mapTokenValue(unresolvedToken, "color")).toEqual({
      value: unresolvedToken.value,
      meta: "unresolved",
    });
  });
});