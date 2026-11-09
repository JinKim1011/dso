import type { Token, TokenType } from "@repo/contracts/type";
import { describe, expect, it } from "vitest";
import { createTokenReferenceLookup } from "./create-token-reference-lookup";
import { mapTokenType } from "./map-token-type";

const tokenType: TokenType = {
  id: "color-base",
  projectId: "project",
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
};

const tokens: Token[] = [
  {
    id: "token-b",
    projectId: tokenType.projectId,
    tokenTypeId: tokenType.id,
    name: "blue",
    cssVar: "--base-blue",
    value: { kind: "single", value: "oklch(60% 0.2 240)" },
  },
  {
    id: "token-a",
    projectId: tokenType.projectId,
    tokenTypeId: tokenType.id,
    name: "red",
    cssVar: "--base-red",
    value: { kind: "single", value: "oklch(60% 0.2 30)" },
  },
];
const lookup = createTokenReferenceLookup([tokenType], tokens, []);

describe("mapTokenType", () => {
  it("maps and sorts tokens belonging to the type", () => {
    const inputTokens = [...tokens].reverse();
    const tokensByType = new Map<string, Token[]>([[tokenType.id, inputTokens]]);

    expect(mapTokenType(tokenType, tokensByType, lookup)).toEqual({
      id: tokenType.id,
      category: "color",
      type: "Base",
      kind: "primitive",
      values: [...tokens]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((token) => ({
          id: token.id,
          name: token.name,
          cssVar: token.cssVar ?? undefined,
          value: token.value,
          meta: token.value.kind === "single" ? token.value.value : undefined,
          preview:
            token.value.kind === "single"
              ? { kind: "single", value: token.value.value }
              : undefined,
        })),
    });
  });

  it("returns an empty values list when the type has no tokens", () => {
    expect(mapTokenType(tokenType, new Map(), lookup)).toEqual({
      id: tokenType.id,
      category: "color",
      type: "Base",
      kind: "primitive",
      values: [],
    });
  });

  it("rejects unsupported categories", () => {
    const invalidTokenType: TokenType = {
      ...tokenType,
      category: "unknown",
    };

    expect(() => mapTokenType(invalidTokenType, new Map(), lookup)).toThrow(
      `Unsupported token category "unknown" for token type "${tokenType.id}".`,
    );
  });
});
