import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateTokenReferences } from "@repo/contracts/validation/seed/references";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateTokenReferences", () => {
  it("accepts valid token references", () => {
    expect(validateTokenReferences(validSeed)).toEqual([]);
  });

  it("rejects a missing referenced token", () => {
    const seed = cloneSeed();
    seed.tokenReferences[0]!.referencedTokenId = "missing-token";

    expect(validateTokenReferences(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-reference",
        collection: "tokenReferences",
      }),
    );
  });

  it("rejects a self-reference", () => {
    const seed = cloneSeed();

    seed.tokenReferences[0] = {
      ...seed.tokenReferences[0]!,
      referencingTokenId: "token-white",
      referencedTokenId: "token-white",
      slot: "light",
    };

    expect(validateTokenReferences(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-reference",
        collection: "tokenReferences",
      }),
    );
  });

  it("rejects a cross-project reference", () => {
    const seed = cloneSeed();

    seed.tokens.push({
      ...seed.tokens[1]!,
      id: "token-other-project",
      projectId: "project-2",
    });

    seed.tokenReferences[0]!.referencedTokenId = "token-other-project";

    expect(validateTokenReferences(seed)).toContainEqual(
      expect.objectContaining({
        code: "wrong-project",
        collection: "tokenReferences",
      }),
    );
  });
});
