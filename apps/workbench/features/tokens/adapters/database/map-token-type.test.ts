import type { Token, TokenType } from "@repo/contracts/type";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";
import { mapTokenType } from "./map-token-type";

const tokenType = validSeed.tokenTypes.find(
  (candidate) => candidate.category === "color" && candidate.name === "Base",
)!;
const tokens = validSeed.tokens.filter((token) => token.tokenTypeId === tokenType.id);

describe("mapTokenType", () => {
  it("maps and sorts tokens belonging to the type", () => {
    const inputTokens = [...tokens].reverse();
    const tokensByType = new Map<string, Token[]>([[tokenType.id, inputTokens]]);

    expect(mapTokenType(tokenType, tokensByType)).toEqual({
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
    expect(mapTokenType(tokenType, new Map())).toEqual({
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

    expect(() => mapTokenType(invalidTokenType, new Map())).toThrow(
      `Unsupported token category "unknown" for token type "${tokenType.id}".`,
    );
  });
});
