// provides focused seed records for validation tests.

import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type { SeedData } from "@repo/contracts/seed";
import type {
  Component,
  DocumentTemplate,
  Project,
  ProjectMember,
  Release,
  Token,
  TokenReference,
  TokenType,
  User,
} from "@repo/contracts/type";

const fixtureTimestamp = "2026-10-27T10:00:00.000Z";

export const seedUserFixture = {
  id: fixtureIds.user,
  email: "seed-user@example.test",
  passwordHash: "not-a-real-password-hash",
  createdAt: fixtureTimestamp,
} satisfies User;

export const seedProjectFixture = {
  id: fixtureIds.project,
  slug: "seed-project",
  name: "Seed Project",
  createdAt: fixtureTimestamp,
} satisfies Project;

export const seedProjectMemberFixture = {
  projectId: fixtureIds.project,
  userId: fixtureIds.user,
  role: "publisher",
  createdAt: fixtureTimestamp,
} satisfies ProjectMember;

export const seedReleaseFixture = {
  id: fixtureIds.release,
  projectId: fixtureIds.project,
  version: "1.0.0",
  status: "published",
  createdAt: fixtureTimestamp,
  publishedAt: fixtureTimestamp,
} satisfies Release;

export const seedTokenTypeFixture = {
  id: fixtureIds.primitiveTokenType,
  projectId: fixtureIds.project,
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
} satisfies TokenType;

export const seedSemanticTokenTypeFixture = {
  id: fixtureIds.semanticTokenType,
  projectId: fixtureIds.project,
  parentTypeId: fixtureIds.primitiveTokenType,
  category: "color",
  name: "Semantic",
  kind: "semantic",
} satisfies TokenType;

export const seedTokenFixture = {
  id: fixtureIds.singleToken,
  projectId: fixtureIds.project,
  tokenTypeId: fixtureIds.primitiveTokenType,
  name: "white",
  cssVar: "--color-white",
  value: { kind: "single", value: "#ffffff" },
} satisfies Token;

export const seedModeTokenFixture = {
  id: fixtureIds.modeToken,
  projectId: fixtureIds.project,
  tokenTypeId: fixtureIds.semanticTokenType,
  name: "surface",
  cssVar: "--color-surface",
  value: { kind: "modes" },
} satisfies Token;

export const seedTokenReferenceFixture = {
  projectId: fixtureIds.project,
  referencingTokenId: fixtureIds.modeToken,
  referencedTokenId: fixtureIds.singleToken,
  slot: "light",
} satisfies TokenReference;

export const seedComponentFixture = {
  id: fixtureIds.component,
  projectId: fixtureIds.project,
  name: "Button",
  slug: "button",
  description: "Button component",
  documentPath: "components/button.md",
} satisfies Component;

export const seedDocumentTemplateFixture = {
  id: fixtureIds.documentTemplate,
  projectId: fixtureIds.project,
  componentId: fixtureIds.component,
  name: "Button documentation",
  content: "# Button",
} satisfies DocumentTemplate;

export function createSeedData(overrides: Partial<SeedData> = {}): SeedData {
  return {
    users: [],
    projects: [],
    projectMembers: [],
    tokenTypes: [],
    tokens: [],
    tokenReferences: [],
    components: [],
    documentTemplates: [],
    releases: [],
    ...overrides,
  };
}
