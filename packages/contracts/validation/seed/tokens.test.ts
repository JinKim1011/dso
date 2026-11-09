import { validateTokens } from "@repo/contracts/validation/seed/tokens";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  createSeedData,
  seedModeTokenFixture,
  seedProjectFixture,
  seedSemanticTokenTypeFixture,
  seedTokenFixture,
  seedTokenTypeFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("validateTokens", () => {
  it("accepts a valid token domain", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      tokenTypes: [seedTokenTypeFixture, seedSemanticTokenTypeFixture],
      tokens: [seedTokenFixture, seedModeTokenFixture],
    });

    expect(validateTokens(seed)).toEqual([]);
  });

  it("rejects a token with a missing token type", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      tokens: [{ ...seedTokenFixture, tokenTypeId: "missing-type" }],
    });

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "tokens",
        id: seedTokenFixture.id,
      }),
    );
  });

  it("rejects a token belonging to another project", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      tokenTypes: [seedTokenTypeFixture],
      tokens: [{ ...seedTokenFixture, projectId: "project-2" }],
    });

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "wrong-project",
        collection: "tokens",
        id: seedTokenFixture.id,
      }),
    );
  });

  it("rejects an unsupported token kind", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      tokenTypes: [{ ...seedTokenTypeFixture, kind: "invalid" as never }],
    });

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-enum",
        collection: "tokenTypes",
        id: seedTokenTypeFixture.id,
      }),
    );
  });

  it("rejects duplicate tokens", () => {
    const seed = createSeedData({
      tokens: [seedTokenFixture, { ...seedTokenFixture }],
    });

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        collection: "tokens",
        id: seedTokenFixture.id,
      }),
    );
  });

  it("rejects a cyclic token hierarchy", () => {
    const seed = createSeedData({
      tokenTypes: [
        {
          ...seedTokenTypeFixture,
          parentTypeId: seedSemanticTokenTypeFixture.id,
        },
        {
          ...seedSemanticTokenTypeFixture,
          parentTypeId: seedTokenTypeFixture.id,
        },
      ],
    });

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-hierarchy",
        collection: "tokenTypes",
      }),
    );
  });

  it("rejects an overlong token value", () => {
    const seed = createSeedData({
      tokens: [
        {
          ...seedTokenFixture,
          value: {
            kind: "single",
            value: "a".repeat(CONTRACT_LIMITS.tokenValue + 1),
          },
        },
      ],
    });

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokens",
        id: seedTokenFixture.id,
        field: "value.value",
      }),
    );
  });
});
