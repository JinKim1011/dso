import { validateTokenReferences } from "@repo/contracts/validation/seed/references";
import {
  createSeedData,
  seedModeTokenFixture,
  seedProjectFixture,
  seedSemanticTokenTypeFixture,
  seedTokenFixture,
  seedTokenReferenceFixture,
  seedTokenTypeFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("validateTokenReferences", () => {
  it("accepts valid token references", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      tokenTypes: [seedTokenTypeFixture, seedSemanticTokenTypeFixture],
      tokens: [seedTokenFixture, seedModeTokenFixture],
      tokenReferences: [seedTokenReferenceFixture],
    });

    expect(validateTokenReferences(seed)).toEqual([]);
  });

  it("rejects a missing referenced token", () => {
    const seed = createSeedData({
      tokenTypes: [seedTokenTypeFixture, seedSemanticTokenTypeFixture],
      tokens: [seedTokenFixture, seedModeTokenFixture],
      tokenReferences: [
        { ...seedTokenReferenceFixture, referencedTokenId: "missing-token" },
      ],
    });

    expect(validateTokenReferences(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-reference",
        collection: "tokenReferences",
      }),
    );
  });

  it("rejects a self-reference", () => {
    const seed = createSeedData({
      tokenTypes: [seedTokenTypeFixture, seedSemanticTokenTypeFixture],
      tokens: [seedTokenFixture, seedModeTokenFixture],
      tokenReferences: [
        {
          ...seedTokenReferenceFixture,
          referencedTokenId: seedModeTokenFixture.id,
        },
      ],
    });

    expect(validateTokenReferences(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-reference",
        collection: "tokenReferences",
      }),
    );
  });

  it("rejects a cross-project reference", () => {
    const otherProjectToken = {
      ...seedTokenFixture,
      id: "token-other-project",
      projectId: "project-2",
    };
    const seed = createSeedData({
      tokenTypes: [seedTokenTypeFixture, seedSemanticTokenTypeFixture],
      tokens: [seedModeTokenFixture, otherProjectToken],
      tokenReferences: [
        {
          ...seedTokenReferenceFixture,
          referencedTokenId: otherProjectToken.id,
        },
      ],
    });

    expect(validateTokenReferences(seed)).toContainEqual(
      expect.objectContaining({
        code: "wrong-project",
        collection: "tokenReferences",
      }),
    );
  });
});
