import type { SeedData } from "@repo/contracts/seed";

export const validSeed: SeedData = {
  users: [
    {
      id: "user-1",
      email: "developer@example.test",
      passwordHash: "fake-seed-hash",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projects: [
    {
      id: "project-1",
      slug: "design-system",
      name: "Design System",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  projectMembers: [
    {
      projectId: "project-1",
      userId: "user-1",
      role: "publisher",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
  tokenTypes: [
    {
      id: "token-type-base",
      projectId: "project-1",
      parentTypeId: null,
      category: "color",
      name: "Base",
      kind: "primitive",
    },
    {
      id: "token-type-semantic",
      projectId: "project-1",
      parentTypeId: "token-type-base",
      category: "color",
      name: "Semantic",
      kind: "semantic",
    },
  ],
  tokens: [
    {
      id: "token-white",
      projectId: "project-1",
      tokenTypeId: "token-type-base",
      name: "white",
      cssVar: "--color-white",
      value: {
        kind: "single",
        value: "#ffffff",
      },
    },
    {
      id: "token-surface",
      projectId: "project-1",
      tokenTypeId: "token-type-semantic",
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
      projectId: "project-1",
      referencingTokenId: "token-surface",
      referencedTokenId: "token-white",
      slot: "light",
    },
  ],
  components: [
    {
      id: "component-button",
      projectId: "project-1",
      name: "Button",
      slug: "button",
      description: "Button component",
      documentPath: "components/button.md",
    },
  ],
  documentTemplates: [
    {
      id: "template-button",
      projectId: "project-1",
      componentId: "component-button",
      name: "Button documentation",
      content: "# Button",
    },
  ],
  releases: [
    {
      id: "release-1",
      projectId: "project-1",
      version: "1.0.0",
      status: "published",
      publishedAt: "2026-10-27T10:00:00.000Z",
      createdAt: "2026-10-27T10:00:00.000Z",
    },
  ],
};
