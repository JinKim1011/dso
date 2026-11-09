import { validateSeedIdentifiers } from "@repo/contracts/validation/seed/identifiers";
import {
  createSeedData,
  seedComponentFixture,
  seedDocumentTemplateFixture,
  seedProjectFixture,
  seedProjectMemberFixture,
  seedReleaseFixture,
  seedTokenFixture,
  seedTokenReferenceFixture,
  seedTokenTypeFixture,
  seedUserFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("validateSeedIdentifiers", () => {
  it("accepts valid identifiers", () => {
    const seed = createSeedData({
      users: [seedUserFixture],
      projects: [seedProjectFixture],
      projectMembers: [seedProjectMemberFixture],
      tokenTypes: [seedTokenTypeFixture],
      tokens: [seedTokenFixture],
      tokenReferences: [seedTokenReferenceFixture],
      components: [seedComponentFixture],
      documentTemplates: [seedDocumentTemplateFixture],
      releases: [seedReleaseFixture],
    });

    expect(validateSeedIdentifiers(seed)).toEqual([]);
  });

  it("rejects an empty project ID", () => {
    const seed = createSeedData({
      projects: [{ ...seedProjectFixture, id: "" }],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "projects",
        field: "id",
      }),
    );
  });

  it("rejects path separators in a token type ID", () => {
    const seed = createSeedData({
      tokenTypes: [{ ...seedTokenTypeFixture, id: "color/base" }],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokenTypes",
        field: "id",
      }),
    );
  });

  it("rejects an overlong token ID", () => {
    const seed = createSeedData({
      tokens: [{ ...seedTokenFixture, id: "a".repeat(129) }],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokens",
        field: "id",
      }),
    );
  });

  it("rejects an invalid project member user ID", () => {
    const seed = createSeedData({
      projectMembers: [{ ...seedProjectMemberFixture, userId: "user/member" }],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "projectMembers",
        field: "userId",
      }),
    );
  });

  it("rejects an invalid token reference ID", () => {
    const seed = createSeedData({
      tokenReferences: [
        { ...seedTokenReferenceFixture, referencedTokenId: "token/reference" },
      ],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "tokenReferences",
        field: "referencedTokenId",
      }),
    );
  });

  it("accepts a null parent type ID", () => {
    const seed = createSeedData({
      tokenTypes: [{ ...seedTokenTypeFixture, parentTypeId: null }],
    });

    expect(validateSeedIdentifiers(seed)).toEqual([]);
  });

  it("rejects an invalid component slug", () => {
    const seed = createSeedData({
      components: [{ ...seedComponentFixture, slug: "button/component" }],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "components",
        field: "slug",
      }),
    );
  });

  it("rejects an invalid template component ID", () => {
    const seed = createSeedData({
      documentTemplates: [
        { ...seedDocumentTemplateFixture, componentId: "component/template" },
      ],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "documentTemplates",
        field: "componentId",
      }),
    );
  });

  it("rejects an invalid release project ID", () => {
    const seed = createSeedData({
      releases: [{ ...seedReleaseFixture, projectId: "project/release" }],
    });

    expect(validateSeedIdentifiers(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-field",
        collection: "releases",
        field: "projectId",
      }),
    );
  });
});
