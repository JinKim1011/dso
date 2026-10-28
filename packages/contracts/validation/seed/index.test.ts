import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateSeedData } from "@repo/contracts/validation/seed/index";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateSeedData", () => {
  it("accepts a complete valid seed", () => {
    expect(validateSeedData(validSeed)).toEqual([]);
  });

  it("rejects a token whose type does not exist", () => {
    const seed = cloneSeed();
    seed.tokens[0]!.tokenTypeId = "missing-type";

    const errors = validateSeedData(seed);

    expect(errors).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "tokens",
        id: "token-white",
      }),
    );
  });

  it("rejects a cross-project token reference", () => {
    const seed = cloneSeed();

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
    const seed = cloneSeed();

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
    const seed = cloneSeed();

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

  it("rejects duplicate token references", () => {
    const seed = cloneSeed();
    seed.tokenReferences.push({ ...seed.tokenReferences[0]! });

    const errors = validateSeedData(seed);

    expect(errors).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        collection: "tokenReferences",
      }),
    );
  });

  it("rejects unsafe component document paths", () => {
    const seed = cloneSeed();
    seed.components[0]!.documentPath = "../secrets.md";

    const errors = validateSeedData(seed);

    expect(errors.some((error) => error.code === "invalid-document-path")).toBe(true);
  });

  it("rejects a membership for a missing user", () => {
    const seed = cloneSeed();
    seed.projectMembers[0]!.userId = "missing-user";

    const errors = validateSeedData(seed);

    expect(errors).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "projectMembers",
        field: "userId",
      }),
    );
  });

  it("rejects a release for a missing project", () => {
    const seed = cloneSeed();
    seed.releases[0]!.projectId = "missing-project";

    const errors = validateSeedData(seed);

    expect(errors).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "releases",
        field: "projectId",
      }),
    );
  });
});
