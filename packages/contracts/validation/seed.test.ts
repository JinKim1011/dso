import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateSeedData } from "@repo/contracts/validation/seed";
import { describe, expect, it } from "vitest";

const cloneSeed = <T>(seed: T): T => structuredClone(seed);

describe("validateSeedData", () => {
  it("accepts a complete valid seed", () => {
    expect(validateSeedData(validSeed)).toEqual([]);
  });

  it("rejects a token whose type does not exist", () => {
    const seed = cloneSeed(validSeed);

    seed.tokens[0]!.tokenTypeId = "missing-type";

    const errors = validateSeedData(seed);

    expect(errors.some((error) => error.code === "invalid-reference")).toBe(true);
  });

  it("rejects a cross-project token reference", () => {
    const seed = cloneSeed(validSeed);

    seed.tokens.push({
      ...seed.tokens[1]!,
      id: "token-other-project",
      projectId: "project-2",
    });

    seed.tokenReferences[0] = {
      ...seed.tokenReferences[0]!,
      referencedTokenId: "token-other-project",
    };

    const errors = validateSeedData(seed);

    expect(errors.some((error) => error.code === "wrong-project")).toBe(true);
  });

  it("rejects a self-reference", () => {
    const seed = cloneSeed(validSeed);

    seed.tokenReferences[0] = {
      ...seed.tokenReferences[0]!,
      referencingTokenId: "token-white",
      referencedTokenId: "token-white",
      slot: "light",
    };

    const errors = validateSeedData(seed);

    expect(errors.some((error) => error.code === "invalid-reference")).toBe(true);
  });

  it("rejects a cyclic token hierarchy", () => {
    const seed = cloneSeed(validSeed);

    seed.tokenTypes = [
      {
        ...seed.tokenTypes[0]!,
        parentTypeId: "token-type-semantic",
      },
      {
        ...seed.tokenTypes[1]!,
        parentTypeId: "token-type-base",
      },
    ];

    const errors = validateSeedData(seed);

    expect(errors.some((error) => error.code === "invalid-hierarchy")).toBe(true);
  });

  it("rejects duplicate references", () => {
    const seed = cloneSeed(validSeed);

    seed.tokenReferences.push({
      ...seed.tokenReferences[0]!,
    });

    const errors = validateSeedData(seed);

    expect(errors.some((error) => error.code === "duplicate-id")).toBe(true);
  });

  it("rejects unsafe component document paths", () => {
    const seed = cloneSeed(validSeed);

    seed.components[0]!.documentPath = "../secrets.md";

    const errors = validateSeedData(seed);

    expect(errors.some((error) => error.code === "invalid-document-path")).toBe(true);
  });
});
