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
const neutral = validSeed.tokens.find((token) => token.cssVar === "--base-neutral-0")!;
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
    expect(surface.value).toEqual({
      kind: "modes",
      light: "var(--base-neutral-0)",
      dark: "var(--base-neutral-900)",
    });
  });

  it("resolves seeded typography slots to their primitive values", () => {
    expect(resolveTypographyToken(body, bodyType, lookup)).toEqual({
      fontSize: "1rem",
      fontWeight: "400",
      lineHeight: "1.7",
    });
    expect(body.value).toEqual({
      kind: "typography",
      fontSize: "var(--text-regular)",
      fontWeight: "var(--font-regular)",
      lineHeight: "var(--leading-relaxed)",
    });
  });

  it("preserves literal and absent values without references", () => {
    const emptyLookup = createTokenReferenceLookup([], [], []);
    expect(
      resolveModeToken(
        { ...surface, value: { kind: "modes", light: "#fff" } },
        surfaceType,
        emptyLookup,
      ),
    ).toEqual({ light: "#fff", dark: undefined });
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
    ).toEqual({ fontSize: "1rem", fontWeight: "400", lineHeight: "1.5" });
  });

  it("allows empty typography slots while still validating populated slots", () => {
    const emptyLookup = createTokenReferenceLookup([], [], []);
    expect(
      resolveTypographyToken(
        { ...body, value: { kind: "typography", fontWeight: "400" } },
        bodyType,
        emptyLookup,
      ),
    ).toEqual({ fontSize: undefined, fontWeight: "400", lineHeight: undefined });
    expect(() =>
      resolveTypographyToken(
        { ...body, value: { kind: "typography", lineHeight: "var(--missing)" } },
        bodyType,
        emptyLookup,
      ),
    ).toThrow(`Missing reference for token "${body.id}" and slot "lineHeight".`);
  });

  it("reports references missing for expressions, including typography", () => {
    const emptyLookup = createTokenReferenceLookup([], [], []);
    expect(() => resolveModeToken(surface, surfaceType, emptyLookup)).toThrow(
      `Missing reference for token "${surface.id}" and slot "light".`,
    );
    expect(() => resolveTypographyToken(body, bodyType, emptyLookup)).toThrow(
      `Missing reference for token "${body.id}" and slot "fontSize".`,
    );
  });

  it("rejects mismatched values and permits whitespace around a simple reference", () => {
    const neutralType = validSeed.tokenTypes.find(
      (type) => type.id === neutral.tokenTypeId,
    )!;
    const onlyLight = {
      ...surface,
      value: { kind: "modes" as const, light: " var( --base-neutral-0 ) " },
    };
    expect(
      resolveModeToken(onlyLight, surfaceType, lookupFor(neutral, neutralType)),
    ).toEqual({
      light: "oklch(98.5% 0 0)",
      dark: undefined,
    });
    expect(() =>
      resolveModeToken(
        { ...onlyLight, value: { kind: "modes", light: "var(--other)" } },
        surfaceType,
        lookupFor(neutral, neutralType),
      ),
    ).toThrow(`Value and reference disagree for token "${surface.id}" and slot "light".`);
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
    const weight = validSeed.tokens.find((token) => token.cssVar === "--font-regular")!;
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
