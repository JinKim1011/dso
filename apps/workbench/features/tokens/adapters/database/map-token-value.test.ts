import type { Token, TokenType } from "@repo/contracts/type";
import { validSeed } from "@repo/seed-data/valid-seed";
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

  it("treats a mode without references as empty, including legacy values", () => {
    const modesToken: Token = {
      ...token,
      value: {
        kind: "modes",
        light: "#fff",
      },
    };

    expect(mapTokenValue(modesToken, { ...colorType, kind: "semantic" }, lookup)).toEqual(
      {
        value: { kind: "modes" },
        meta: "unset / unset",
        preview: undefined,
      },
    );
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
      value: { kind: "modes" },
      references: { light: token.id },
      meta: "sample / unset",
      preview: { kind: "modes", light: "oklch(98.5% 0 0)", dark: undefined },
    });
  });

  it("resolves shadow modes from referenced primitive values", () => {
    const primitiveType: TokenType = { ...colorType, category: "shadow" };
    const semanticType: TokenType = {
      ...primitiveType,
      id: "shadow-semantic",
      kind: "semantic",
    };
    const shadow: Token = {
      ...token,
      value: { kind: "single", value: "0 1px 2px #000" },
    };
    const semantic: Token = {
      ...token,
      id: "shadow-surface",
      tokenTypeId: semanticType.id,
      value: { kind: "modes" },
    };
    const referenceLookup = createTokenReferenceLookup(
      [primitiveType, semanticType],
      [shadow, semantic],
      [
        {
          projectId: token.projectId,
          referencingTokenId: semantic.id,
          referencedTokenId: shadow.id,
          slot: "dark",
        },
      ],
    );
    expect(mapTokenValue(semantic, semanticType, referenceLookup)).toMatchObject({
      meta: "unset / sample",
      references: { dark: shadow.id },
      preview: { kind: "modes", light: undefined, dark: "0 1px 2px #000" },
    });
  });

  it("ignores legacy typography slot values without references", () => {
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
      value: { kind: "typography" },
      meta: "unset / unset / unset",
      preview: undefined,
    });
  });

  it.each(Array.from({ length: 8 }, (_, mask) => mask))(
    "only previews typography when every slot is present (mask %i)",
    (mask) => {
      const body = validSeed.tokens.find(
        (item) => item.name === "body" && item.value.kind === "typography",
      )!;
      const bodyType = validSeed.tokenTypes.find((type) => type.id === body.tokenTypeId)!;
      const slots = ["fontSize", "fontWeight", "lineHeight"] as const;
      const references = validSeed.tokenReferences.filter(
        (reference) =>
          reference.referencingTokenId === body.id &&
          slots.some((slot, index) => slot === reference.slot && !!(mask & (1 << index))),
      );
      const mapped = mapTokenValue(
        body,
        bodyType,
        createTokenReferenceLookup(validSeed.tokenTypes, validSeed.tokens, references),
      );
      expect(mapped.preview).toEqual(
        mask === 7
          ? {
              kind: "typography",
              typography: { fontSize: "1rem", fontWeight: "400", lineHeight: "1.7" },
            }
          : undefined,
      );
    },
  );

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
