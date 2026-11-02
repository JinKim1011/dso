import { fixtureIds } from "@repo/contracts/fixtures/ids";
import type {
  ApiKey,
  Component,
  DocumentTemplate,
  Project,
  ProjectMember,
  Release,
  Session,
  Token,
  TokenReference,
  TokenType,
  User,
} from "@repo/contracts/type";

const project = {
  id: fixtureIds.project,
  slug: "design-system",
  name: "Design System",
  createdAt: "2026-10-27T10:00:00.000Z",
} satisfies Project;

const user = {
  id: fixtureIds.user,
  email: "developer@example.test",
  passwordHash: "hash-only",
  createdAt: "2026-10-27T10:00:00.000Z",
} satisfies User;

const member = {
  projectId: fixtureIds.project,
  userId: fixtureIds.user,
  role: "publisher",
  createdAt: "2026-10-27T10:00:00.000Z",
} satisfies ProjectMember;

const session = {
  id: fixtureIds.session,
  userId: fixtureIds.user,
  createdAt: "2026-10-27T10:00:00.000Z",
  expiresAt: "2026-10-27T18:00:00Z",
} satisfies Session;

export const primitiveTokenType = {
  id: fixtureIds.primitiveTokenType,
  projectId: fixtureIds.project,
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
} satisfies TokenType;

export const semanticTokenType = {
  id: fixtureIds.semanticTokenType,
  projectId: fixtureIds.project,
  parentTypeId: fixtureIds.primitiveTokenType,
  category: "color",
  name: "Semantic",
  kind: "semantic",
} satisfies TokenType;

export const baseColorToken = {
  id: fixtureIds.singleToken,
  projectId: fixtureIds.project,
  tokenTypeId: fixtureIds.primitiveTokenType,
  name: "white",
  cssVar: "--color-white",
  value: {
    kind: "single",
    value: "#ffffff",
  },
} satisfies Token;

export const modeToken = {
  id: fixtureIds.modeToken,
  projectId: fixtureIds.project,
  tokenTypeId: fixtureIds.semanticTokenType,
  name: "surface",
  cssVar: "--color-surface",
  value: {
    kind: "modes",
    light: "#ffffff",
    dark: "#111111",
  },
} satisfies Token;

const reference = {
  projectId: fixtureIds.project,
  referencingTokenId: fixtureIds.modeToken,
  referencedTokenId: fixtureIds.singleToken,
  slot: "light",
} satisfies TokenReference;

const component = {
  id: fixtureIds.component,
  projectId: fixtureIds.project,
  name: "Button",
  slug: "button",
  description: "Button component",
  documentPath: "components/button.md",
} satisfies Component;

const template = {
  id: fixtureIds.documentTemplate,
  projectId: fixtureIds.project,
  componentId: fixtureIds.component,
  name: "Button documentation",
  content: "# Button",
} satisfies DocumentTemplate;

const release = {
  id: fixtureIds.release,
  projectId: fixtureIds.project,
  version: "1.0.0",
  status: "published",
  createdAt: "2026-10-27T10:00:00.000Z",
  publishedAt: "2026-10-27T10:00:00.000Z",
} satisfies Release;

const apiKey = {
  id: fixtureIds.apiKey,
  projectId: fixtureIds.project,
  keyIdentifier: "key-id-1",
  keyHash: "hash-only",
  scope: "release:read",
  createdAt: "2026-10-27T10:00:00.000Z",
  expiresAt: "2026-11-27T10:00:00.000Z",
  revokedAt: null,
} satisfies ApiKey;
