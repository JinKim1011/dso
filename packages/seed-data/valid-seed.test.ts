import { validateSeedData } from "@repo/contracts/validation/seed";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

describe("validSeed", () => {
  it("is a valid complete seed", () => {
    expect(validateSeedData(validSeed)).toEqual([]);
  });

  it("contains unique IDs", () => {
    const ids = [
      ...validSeed.users.map(({ id }) => id),
      ...validSeed.projects.map(({ id }) => id),
      ...validSeed.tokenTypes.map(({ id }) => id),
      ...validSeed.tokens.map(({ id }) => id),
      ...validSeed.components.map(({ id }) => id),
      ...validSeed.documentTemplates.map(({ id }) => id),
      ...validSeed.releases.map(({ id }) => id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });
});
