import {
  primitiveTokenType,
  semanticTokenType,
} from "@repo/contracts/fixtures/domain-contracts";
import type { TokenType } from "@repo/contracts/type";
import { validateTokenTypeInsertionOrder } from "@repo/contracts/validation/seed/token-type-order";
import { describe, expect, it } from "vitest";

describe("validateTokenTypeInsertionOrder", () => {
  it("accepts parents before children", () => {
    expect(
      validateTokenTypeInsertionOrder([primitiveTokenType, semanticTokenType]),
    ).toEqual([]);
  });

  it("rejects children before parents", () => {
    expect(
      validateTokenTypeInsertionOrder([semanticTokenType, primitiveTokenType]),
    ).toEqual([
      {
        code: "invalid-hierarchy",
        collection: "tokenTypes",
        id: semanticTokenType.id,
        field: "parentTypeId",
        message: `Token type "${semanticTokenType.id}" must appear after its parent "${primitiveTokenType.id}" in seed.tokenTypes.`,
      },
    ]);
  });

  it("allows root token types in any position relative to unrelated types", () => {
    const unrelated: TokenType = {
      ...primitiveTokenType,
      id: "spacing",
      name: "Spacing",
    };

    expect(
      validateTokenTypeInsertionOrder([unrelated, primitiveTokenType, semanticTokenType]),
    ).toEqual([]);
  });
});
