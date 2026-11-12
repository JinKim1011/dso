import { createTokenReferenceLookup } from "@/features/tokens/adapters/database/create-token-reference-lookup";
import {
  resolveModeToken,
  resolveTypographyToken,
} from "@/features/tokens/adapters/database/resolve-token-reference";
import type { Token, TokenReference, TokenType } from "@repo/contracts/type";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

const surface = validSeed.tokens.find((token) => token.name === "surface")!;
const surfaceType = validSeed.tokenTypes.find((type) => type.id === surface.tokenTypeId)!;
const body = validSeed.tokens.find(
  (token) => token.name === "body" && token.value.kind === "typography",
)!;
const bodyType = validSeed.tokenTypes.find((type) => type.id === body.tokenTypeId)!;
const neutral = validSeed.tokens.find(
  (token) => token.id === "00000000-0000-4000-8000-000000000106",
)!;
const lookup = createTokenReferenceLookup(
  validSeed.tokenTypes,
  validSeed.tokens,
  validSeed.tokenReferences,
);

function referenceTo(
  target: Token,
  slot: TokenReference["slot"] = "light",
): TokenReference {
  return {
    projectId: surface.projectId,
    referencingTokenId: surface.id,
    referencedTokenId: target.id,
    slot,
  };
}

function lookupFor(
  target: Token,
  targetType: TokenType,
  reference = referenceTo(target),
) {
  return createTokenReferenceLookup([targetType], [target], [reference]);
}

describe("token preview resolvers", () => {
  it("resolves seeded color modes using their respective references", () => {
    expect(resolveModeToken(surface, surfaceType, lookup)).toEqual({
      light: "oklch(98.5% 0 0)",
      dark: "oklch(14.5% 0 0)",
    });
    expect(surface.value).toEqual({ kind: "modes" });
  });

  it("resolves seeded typography slots to their primitive values", () => {
    expect(resolveTypographyToken(body, bodyType, lookup)).toEqual({
      fontSize: "1rem",
      fontWeight: "400",
      lineHeight: "1.7",
    });
    expect(body.value).toEqual({ kind: "typography" });
  });

  it("treats missing references as empty, even with legacy slot values", () => {
    const emptyLookup = createTokenReferenceLookup([], [], []);
    expect(
      resolveModeToken(
        { ...surface, value: { kind: "modes", light: "#fff" } },
        surfaceType,
        emptyLookup,
      ),
    ).toEqual({ light: undefined, dark: undefined });
    expect(
      resolveTypographyToken(
        {
          ...body,
          value: {
            kind: "typography",
            fontSize: "1rem",
            fontWeight: "400",
            lineHeight: "1.5",
          },
        },
        bodyType,
        emptyLookup,
      ),
    ).toEqual({ fontSize: undefined, fontWeight: undefined, lineHeight: undefined });
  });

  it("ignores legacy expressions when the reference is absent", () => {
    const emptyLookup = createTokenReferenceLookup([], [], []);
    expect(
      resolveModeToken(
        { ...surface, value: { kind: "modes", light: "var(--missing)" } },
        surfaceType,
        emptyLookup,
      ),
    ).toEqual({ light: undefined, dark: undefined });
    expect(
      resolveTypographyToken(
        { ...body, value: { kind: "typography", lineHeight: "var(--missing)" } },
        bodyType,
        emptyLookup,
      ),
    ).toEqual({ fontSize: undefined, fontWeight: undefined, lineHeight: undefined });
  });

  it("resolves references by ID regardless of the token value expression", () => {
    const neutralType = validSeed.tokenTypes.find(
      (type) => type.id === neutral.tokenTypeId,
    )!;
    const onlyLight = {
      ...surface,
      value: { kind: "modes" as const, light: "var(--other)" },
    };
    expect(
      resolveModeToken(onlyLight, surfaceType, lookupFor(neutral, neutralType)),
    ).toEqual({
      light: "oklch(98.5% 0 0)",
      dark: undefined,
    });
  });

  it("rejects an incompatible referenced token and unresolved primitive value", () => {
    const neutralType = validSeed.tokenTypes.find(
      (type) => type.id === neutral.tokenTypeId,
    )!;
    const onlyLight: Token = {
      ...surface,
      value: { kind: "modes", light: "var(--base-neutral-0)" },
    };
    expect(() =>
      resolveModeToken(
        onlyLight,
        surfaceType,
        lookupFor(neutral, { ...neutralType, category: "typography" }),
      ),
    ).toThrow(`Invalid reference for token "${surface.id}" and slot "light".`);
    expect(() =>
      resolveModeToken(
        onlyLight,
        surfaceType,
        lookupFor(
          { ...neutral, value: { kind: "single", value: "var(--missing)" } },
          neutralType,
        ),
      ),
    ).toThrow(`Referenced token "${neutral.id}" has an unresolved value`);
  });

  it("validates typography references against their slot", () => {
    const weight = validSeed.tokens.find(
      (token) => token.id === "00000000-0000-4000-8000-00000000023b",
    )!;
    const weightType = validSeed.tokenTypes.find(
      (type) => type.id === weight.tokenTypeId,
    )!;
    const wrongReference: TokenReference = {
      projectId: body.projectId,
      referencingTokenId: body.id,
      referencedTokenId: weight.id,
      slot: "fontSize",
    };
    expect(() =>
      resolveTypographyToken(
        body,
        bodyType,
        lookupFor(weight, weightType, wrongReference),
      ),
    ).toThrow(`Invalid reference for token "${body.id}" and slot "fontSize".`);
  });

  it("rejects incorrect source types", () => {
    expect(() => resolveModeToken(surface, bodyType, lookup)).toThrow(
      `Token "${surface.id}" is not a semantic mode token.`,
    );
    expect(() => resolveTypographyToken(body, surfaceType, lookup)).toThrow(
      `Token "${body.id}" is not a semantic typography token.`,
    );
  });
});
