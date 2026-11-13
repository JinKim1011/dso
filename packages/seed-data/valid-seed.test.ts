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

  it("stores semantic mode and typography slots only as references", () => {
    const tokens = validSeed.tokens.filter(
      (token) => token.value.kind === "modes" || token.value.kind === "typography",
    );
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) {
      expect(token.value).toEqual({ kind: token.value.kind });
      expect(
        validSeed.tokenReferences.some(
          (reference) => reference.referencingTokenId === token.id,
        ),
      ).toBe(true);
    }
  });
});
