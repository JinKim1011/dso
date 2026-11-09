import { createTokenReferenceLookup } from "@/features/tokens/adapters/database/create-token-reference-lookup";
import type { Token, TokenReference, TokenType } from "@repo/contracts/type";
import { describe, expect, it } from "vitest";

const colorType: TokenType = {
  id: "color-base",
  projectId: "project",
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
};

const typographyType: TokenType = {
  ...colorType,
  id: "font-size",
  category: "typography",
  name: "font-size",
};

const color: Token = {
  id: "neutral-0",
  projectId: "project",
  tokenTypeId: colorType.id,
  name: "neutral-0",
  cssVar: "--base-neutral-0",
  value: { kind: "single", value: "oklch(98.5% 0 0)" },
};

const fontSize: Token = {
  ...color,
  id: "regular",
  tokenTypeId: typographyType.id,
  name: "regular",
  cssVar: "--text-regular",
  value: { kind: "single", value: "1rem" },
};

const lightReference: TokenReference = {
  projectId: "project",
  referencingTokenId: "surface",
  referencedTokenId: color.id,
  slot: "light",
};

describe("createTokenReferenceLookup", () => {
  it("finds references by token and slot across categories", () => {
    const lookup = createTokenReferenceLookup(
      [colorType, typographyType],
      [color, fontSize],
      [
        lightReference,
        { ...lightReference, slot: "dark", referencedTokenId: color.id },
        {
          ...lightReference,
          referencingTokenId: "body",
          referencedTokenId: fontSize.id,
          slot: "fontSize",
        },
        { ...lightReference, referencingTokenId: "other-surface" },
      ],
    );

    expect(lookup.find("surface", "light")).toEqual({
      kind: "found",
      token: color,
      tokenType: colorType,
    });
    expect(lookup.find("surface", "dark")).toEqual({
      kind: "found",
      token: color,
      tokenType: colorType,
    });
    expect(lookup.find("body", "fontSize")).toEqual({
      kind: "found",
      token: fontSize,
      tokenType: typographyType,
    });
    expect(lookup.find("other-surface", "light")).toEqual({
      kind: "found",
      token: color,
      tokenType: colorType,
    });
    expect(lookup.find("surface", "fontSize")).toEqual({ kind: "not-found" });
    expect(lookup.find("missing", "light")).toEqual({ kind: "not-found" });
  });

  it("rejects duplicate references for the same token and slot", () => {
    expect(() =>
      createTokenReferenceLookup(
        [colorType],
        [color],
        [lightReference, { ...lightReference, referencedTokenId: "another-token" }],
      ),
    ).toThrow('Duplicate reference for token "surface" and slot "light".');
  });

  it("reports references to missing tokens", () => {
    const lookup = createTokenReferenceLookup([colorType], [], [lightReference]);

    expect(() => lookup.find("surface", "light")).toThrow(
      'Reference for token "surface" and slot "light" points to missing token "neutral-0".',
    );
  });

  it("reports referenced tokens with missing token types", () => {
    const lookup = createTokenReferenceLookup([], [color], [lightReference]);

    expect(() => lookup.find("surface", "light")).toThrow(
      'Referenced token "neutral-0" has missing token type "color-base".',
    );
  });
});
