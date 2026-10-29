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

  it("rejects an invalid project member user ID", () => {
    const seed = structuredClone(validSeed);
    seed.projectMembers[0]!.userId = "user/member";

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "projectMembers",
        field: "userId",
      }),
    );
  });

  it("rejects an invalid token reference ID", () => {
    const seed = structuredClone(validSeed);
    seed.tokenReferences[0]!.referencedTokenId = "token/reference";

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokenReferences",
        field: "referencedTokenId",
      }),
    );
  });

  it("accepts a null parent type ID", () => {
    const seed = structuredClone(validSeed);
    seed.tokenTypes[0]!.parentTypeId = null;

    expect(validateSeedIdentifiers(seed)).toEqual([]);
  });

  it("rejects an invalid component slug", () => {
    const seed = structuredClone(validSeed);
    seed.components[0]!.slug = "button/component";

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "components",
        field: "slug",
      }),
    );
  });

  it("rejects an invalid template component ID", () => {
    const seed = structuredClone(validSeed);
    seed.documentTemplates[0]!.componentId = "component/template";

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "documentTemplates",
        field: "componentId",
      }),
    );
  });

  it("rejects an invalid release project ID", () => {
    const seed = structuredClone(validSeed);
    seed.releases[0]!.projectId = "project/release";

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "releases",
        field: "projectId",
      }),
    );
  });
});
