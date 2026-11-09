import { fixtureIds } from "@repo/contracts/fixtures/ids";
import { validateTokens } from "@repo/contracts/validation/seed/tokens";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateTokens", () => {
  it("accepts a valid token domain", () => {
    expect(validateTokens(validSeed)).toEqual([]);
  });

  it("rejects a token with a missing token type", () => {
    const seed = cloneSeed();
    seed.tokens[0]!.tokenTypeId = "missing-type";

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "tokens",
        id: fixtureIds.seed.tokens[0],
      }),
    );
  });

  it("rejects a token belonging to another project", () => {
    const seed = cloneSeed();
    seed.tokens[0]!.projectId = "project-2";

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "wrong-project",
        collection: "tokens",
        id: fixtureIds.seed.tokens[0],
      }),
    );
  });

  it("rejects an unsupported token kind", () => {
    const seed = cloneSeed();
    seed.tokenTypes[0]!.kind = "invalid" as never;

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-enum",
        collection: "tokenTypes",
        id: fixtureIds.seed.tokenTypes.primitiveColor,
      }),
    );
  });

  it("rejects duplicate tokens", () => {
    const seed = cloneSeed();
    seed.tokens.push({ ...seed.tokens[0]! });

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "duplicate-id",
        collection: "tokens",
        id: fixtureIds.seed.tokens[0],
      }),
    );
  });

  it("rejects a cyclic token hierarchy", () => {
    const seed = cloneSeed();

    seed.tokenTypes = [
      {
        ...seed.tokenTypes[0]!,
        parentTypeId: fixtureIds.seed.tokenTypes.semanticSurface,
      },
      {
        ...seed.tokenTypes[1]!,
        parentTypeId: fixtureIds.seed.tokenTypes.primitiveColor,
      },
    ];

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-hierarchy",
        collection: "tokenTypes",
      }),
    );
  });

  it("rejects an overlong token value", () => {
    const seed = cloneSeed();

    seed.tokens[0]!.value = {
      kind: "single",
      value: "a".repeat(10_001),
    };

    expect(validateTokens(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokens",
        id: fixtureIds.seed.tokens[0],
        field: "value.value",
      }),
    );
  });
});
