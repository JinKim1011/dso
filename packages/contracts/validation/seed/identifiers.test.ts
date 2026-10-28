import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateSeedIdentifiers } from "@repo/contracts/validation/seed/identifiers";
import { describe, expect, it } from "vitest";

describe("validateSeedIdentifiers", () => {
  it("accepts valid identifiers", () => {
    expect(validateSeedIdentifiers(validSeed)).toEqual([]);
  });

  it("rejects an empty project ID", () => {
    const seed = structuredClone(validSeed);
    seed.projects[0]!.id = "";

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "projects",
        field: "id",
      }),
    );
  });

  it("rejects path separators in a token type ID", () => {
    const seed = structuredClone(validSeed);
    seed.tokenTypes[0]!.id = "color/base";

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokenTypes",
        field: "id",
      }),
    );
  });

  it("rejects an overlong token ID", () => {
    const seed = structuredClone(validSeed);
    seed.tokens[0]!.id = "a".repeat(129);

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokens",
        field: "id",
      }),
    );
  });
});
