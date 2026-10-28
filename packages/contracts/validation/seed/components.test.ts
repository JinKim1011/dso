import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { validateComponents } from "@repo/contracts/validation/seed/components";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateComponents", () => {
  it("accepts valid components and templates", () => {
    expect(validateComponents(validSeed)).toEqual([]);
  });

  it("rejects an unsafe document path", () => {
    const seed = cloneSeed();
    seed.components[0]!.documentPath = "../secrets.md";

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "invalid-document-path",
        collection: "components",
        field: "documentPath",
      }),
    );
  });

  it("rejects a component with a missing project", () => {
    const seed = cloneSeed();
    seed.components[0]!.projectId = "missing-project";

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "components",
        field: "projectId",
      }),
    );
  });

  it("rejects a template with a missing component", () => {
    const seed = cloneSeed();
    seed.documentTemplates[0]!.componentId = "missing-component";

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "missing-record",
        collection: "documentTemplates",
        field: "componentId",
      }),
    );
  });

  it("rejects a template and component from different projects", () => {
    const seed = cloneSeed();

    seed.projects.push({
      id: "project-2",
      slug: "second-project",
      name: "Second Project",
      createdAt: "2026-10-27T10:00:00Z",
    });

    seed.documentTemplates[0]!.projectId = "project-2";

    expect(validateComponents(seed)).toContainEqual(
      expect.objectContaining({
        code: "wrong-project",
        collection: "documentTemplates",
      }),
    );
  });
});
