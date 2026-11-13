import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { listComponentsByProjectId } from "@repo/db/repositories/components";
import { findProjectById } from "@repo/db/repositories/projects";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { listPublishedReleasesByProjectId } from "@repo/db/repositories/releases";
import { listDocumentTemplatesByProjectId } from "@repo/db/repositories/templates";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";
import { validSeed } from "@repo/seed-data/valid-seed";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadWorkbenchProject } from "./load-workbench-project";

vi.mock("@repo/db/repositories/components", () => ({
  listComponentsByProjectId: vi.fn(),
}));
vi.mock("@repo/db/repositories/references", () => ({
  listTokenReferencesByProjectId: vi.fn(),
}));
vi.mock("@repo/db/repositories/projects", () => ({
  findProjectById: vi.fn(),
}));
vi.mock("@repo/db/repositories/releases", () => ({
  listPublishedReleasesByProjectId: vi.fn(),
}));
vi.mock("@repo/db/repositories/templates", () => ({
  listDocumentTemplatesByProjectId: vi.fn(),
}));
vi.mock("@repo/db/repositories/token-types", () => ({
  listTokenTypesByProjectId: vi.fn(),
}));
vi.mock("@repo/db/repositories/tokens", () => ({
  listTokensByProjectId: vi.fn(),
}));

describe("loadWorkbenchProject database pipeline", () => {
  const database = { query: vi.fn() };
  const project = validSeed.projects[0]!;

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(findProjectById).mockResolvedValue(project);
    vi.mocked(listTokenTypesByProjectId).mockResolvedValue(
      [...validSeed.tokenTypes].sort((a, b) => a.id.localeCompare(b.id)),
    );
    vi.mocked(listTokensByProjectId).mockResolvedValue(
      [...validSeed.tokens].sort((a, b) => a.id.localeCompare(b.id)),
    );
    vi.mocked(listTokenReferencesByProjectId).mockResolvedValue(
      [...validSeed.tokenReferences].sort(
        (a, b) =>
          a.referencingTokenId.localeCompare(b.referencingTokenId) ||
          a.referencedTokenId.localeCompare(b.referencedTokenId) ||
          a.slot.localeCompare(b.slot),
      ),
    );
    vi.mocked(listComponentsByProjectId).mockResolvedValue(
      [...validSeed.components].sort((a, b) => a.id.localeCompare(b.id)),
    );
    vi.mocked(listDocumentTemplatesByProjectId).mockResolvedValue(
      [...validSeed.documentTemplates].sort((a, b) => a.id.localeCompare(b.id)),
    );
    vi.mocked(listPublishedReleasesByProjectId).mockResolvedValue(
      [...validSeed.releases].sort((a, b) => a.id.localeCompare(b.id)),
    );
  });

  it("loads repository records and builds the graph view model consumed by layout", async () => {
    const workbenchProject = await loadWorkbenchProject(database, project.id);

    expect(findProjectById).toHaveBeenCalledWith(database, project.id);
    expect(listTokenTypesByProjectId).toHaveBeenCalledWith(database, project.id);
    expect(listTokensByProjectId).toHaveBeenCalledWith(database, project.id);
    expect(listTokenReferencesByProjectId).toHaveBeenCalledWith(database, project.id);
    expect(listComponentsByProjectId).toHaveBeenCalledWith(database, project.id);
    expect(listDocumentTemplatesByProjectId).toHaveBeenCalledWith(database, project.id);
    expect(listPublishedReleasesByProjectId).toHaveBeenCalledWith(database, project.id);

    expect(workbenchProject.project).toEqual(project);
    expect(workbenchProject.tokenTypes).toEqual(
      [...validSeed.tokenTypes].sort((a, b) => a.id.localeCompare(b.id)),
    );
    expect(workbenchProject.tokens).toEqual(
      [...validSeed.tokens].sort((a, b) => a.id.localeCompare(b.id)),
    );
    expect(workbenchProject.references).toEqual(
      [...validSeed.tokenReferences].sort(
        (a, b) =>
          a.referencingTokenId.localeCompare(b.referencingTokenId) ||
          a.referencedTokenId.localeCompare(b.referencedTokenId) ||
          a.slot.localeCompare(b.slot),
      ),
    );
    expect(workbenchProject.components).toEqual(validSeed.components);
    expect(workbenchProject.templates).toEqual(validSeed.documentTemplates);
    expect(workbenchProject.publishedReleases).toEqual(validSeed.releases);

    const viewModel = buildTokenGraphViewModel(
      workbenchProject.tokenTypes,
      workbenchProject.tokens,
      workbenchProject.references,
    );

    expect(viewModel).toMatchObject({
      schemaVersion: 1,
      root: {
        id: "root",
        label: "Design Tokens",
      },
    });

    expect(viewModel.categories.map(({ category }) => category)).toEqual([
      "color",
      "typography",
      "motion",
    ]);

    expect(
      viewModel.tokenTypes
        .flatMap(({ values }) => values)
        .find(({ name }) => name === "surface"),
    ).toMatchObject({
      value: {
        kind: "modes",
      },
      preview: {
        kind: "modes",
        light: "oklch(98.5% 0 0)",
        dark: "oklch(14.5% 0 0)",
      },
    });

    expect(
      viewModel.tokenTypes
        .find(({ category, type }) => category === "color" && type === "Base")
        ?.values.find(({ name }) => name === "neutral-0"),
    ).toMatchObject({
      name: "neutral-0",
      cssVar: "--base-neutral-0",
      value: {
        kind: "single",
        value: "oklch(98.5% 0 0)",
      },
      preview: {
        kind: "single",
        value: "oklch(98.5% 0 0)",
      },
    });

    expect(
      viewModel.tokenTypes
        .find(({ category, type }) => category === "typography" && type === "Typography")
        ?.values.find(({ name }) => name === "body"),
    ).toMatchObject({
      name: "body",
      value: {
        kind: "typography",
      },
      preview: {
        kind: "typography",
        typography: { fontSize: "1rem", fontWeight: "400", lineHeight: "1.7" },
      },
    });
  });
});
