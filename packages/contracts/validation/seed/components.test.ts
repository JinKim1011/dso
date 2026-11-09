import { validateComponents } from "@repo/contracts/validation/seed/components";
import {
  createSeedData,
  seedComponentFixture,
  seedDocumentTemplateFixture,
  seedProjectFixture,
} from "@repo/contracts/fixtures/seed-contracts";
import { describe, expect, it } from "vitest";

describe("validateComponents", () => {
  it("accepts valid components and templates", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      components: [seedComponentFixture],
      documentTemplates: [seedDocumentTemplateFixture],
    });

    expect(validateComponents(seed)).toEqual([]);
  });

  it("rejects an unsafe document path", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      components: [{ ...seedComponentFixture, documentPath: "../secrets.md" }],
    });

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-document-path",
        collection: "components",
        field: "documentPath",
      }),
    );
  });

  it("rejects a component with a missing project", () => {
    const seed = createSeedData({
      components: [{ ...seedComponentFixture, projectId: "missing-project" }],
    });

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "components",
        field: "projectId",
      }),
    );
  });

  it("rejects a template with a missing component", () => {
    const seed = createSeedData({
      projects: [seedProjectFixture],
      components: [seedComponentFixture],
      documentTemplates: [
        { ...seedDocumentTemplateFixture, componentId: "missing-component" },
      ],
    });

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "documentTemplates",
        field: "componentId",
      }),
    );
  });

  it("rejects a template and component from different projects", () => {
    const secondProject = {
      ...seedProjectFixture,
      id: "project-2",
      slug: "second-project",
      name: "Second Project",
    };
    const seed = createSeedData({
      projects: [seedProjectFixture, secondProject],
      components: [seedComponentFixture],
      documentTemplates: [
        { ...seedDocumentTemplateFixture, projectId: secondProject.id },
      ],
    });

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "wrong-project",
        collection: "documentTemplates",
      }),
    );
  });
});
