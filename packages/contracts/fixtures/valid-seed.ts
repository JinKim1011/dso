import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type { SeedData } from "@repo/contracts/seed";

export const validSeed: SeedData = {
  users: [
    {
      id: fixtureIds.user,
      email: "developer@example.test",
      passwordHash: "fake-seed-hash",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projects: [
    {
      id: fixtureIds.project,
      slug: "design-system",
      name: "Design System",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projectMembers: [
    {
      projectId: fixtureIds.project,
      userId: fixtureIds.user,
      role: "publisher",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  tokenTypes: [
    {
      id: fixtureIds.baseTokenType,
      projectId: fixtureIds.project,
      parentTypeId: null,
      category: "color",
      name: "Base",
      kind: "primitive",
    },
    {
      id: fixtureIds.semanticTokenType,
      projectId: fixtureIds.project,
      parentTypeId: fixtureIds.baseTokenType,
      category: "color",
      name: "Semantic",
      kind: "semantic",
    },
  ],
  tokens: [
    {
      id: fixtureIds.whiteToken,
      projectId: fixtureIds.project,
      tokenTypeId: fixtureIds.baseTokenType,
      name: "white",
      cssVar: "--color-white",
      value: {
        kind: "single",
        value: "#ffffff",
      },
    },
    {
      id: fixtureIds.surfaceToken,
      projectId: fixtureIds.project,
      tokenTypeId: fixtureIds.semanticTokenType,
      name: "surface",
      cssVar: "--color-surface",
      value: {
        kind: "modes",
        light: "#ffffff",
        dark: "#111111",
      },
    },
  ],
  tokenReferences: [
    {
      projectId: fixtureIds.project,
      referencingTokenId: fixtureIds.surfaceToken,
      referencedTokenId: fixtureIds.whiteToken,
      slot: "light",
    },
  ],
  components: [
    {
      id: fixtureIds.component,
      projectId: fixtureIds.project,
      name: "Button",
      slug: "button",
      description: "Button component",
      documentPath: "components/button.md",
    },
  ],
  documentTemplates: [
    {
      id: fixtureIds.documentTemplate,
      projectId: fixtureIds.project,
      componentId: fixtureIds.component,
      name: "Button documentation",
      content: "# Button",
    },
  ],
  releases: [
    {
      id: fixtureIds.release,
      projectId: fixtureIds.project,
      version: "1.0.0",
      status: "published",
      publishedAt: "2026-10-27T10:00:00.000Z",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
};
