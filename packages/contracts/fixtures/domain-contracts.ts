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
  id: fixtureIds.domain.project,
  slug: "design-system",
  name: "Design System",
  createdAt: "2026-10-27T10:00:00.000Z",
} satisfies Project;

const user = {
  id: fixtureIds.domain.user,
  email: "developer@example.test",
  passwordHash: "hash-only",
  createdAt: "2026-10-27T10:00:00.000Z",
} satisfies User;

const member = {
  projectId: fixtureIds.domain.project,
  userId: fixtureIds.domain.user,
  role: "publisher",
  createdAt: "2026-10-27T10:00:00.000Z",
} satisfies ProjectMember;

const session = {
  id: fixtureIds.domain.session,
  userId: fixtureIds.domain.user,
  createdAt: "2026-10-27T10:00:00.000Z",
  expiresAt: "2026-10-27T18:00:00Z",
} satisfies Session;

export const primitiveTokenType = {
  id: fixtureIds.domain.primitiveTokenType,
  projectId: fixtureIds.domain.project,
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
} satisfies TokenType;

export const semanticTokenType = {
  id: fixtureIds.domain.semanticTokenType,
  projectId: fixtureIds.domain.project,
  parentTypeId: fixtureIds.domain.primitiveTokenType,
  category: "color",
  name: "Semantic",
  kind: "semantic",
} satisfies TokenType;

export const baseColorToken = {
  id: fixtureIds.domain.singleToken,
  projectId: fixtureIds.domain.project,
  tokenTypeId: fixtureIds.domain.primitiveTokenType,
  name: "white",
  cssVar: "--color-white",
  value: {
    kind: "single",
    value: "#ffffff",
  },
} satisfies Token;

export const modeToken = {
  id: fixtureIds.domain.modeToken,
  projectId: fixtureIds.domain.project,
  tokenTypeId: fixtureIds.domain.semanticTokenType,
  name: "surface",
  cssVar: "--color-surface",
  value: {
    kind: "modes",
    light: "#ffffff",
    dark: "#111111",
  },
} satisfies Token;

const reference = {
  projectId: fixtureIds.domain.project,
  referencingTokenId: fixtureIds.domain.modeToken,
  referencedTokenId: fixtureIds.domain.singleToken,
  slot: "light",
} satisfies TokenReference;

const component = {
  id: fixtureIds.domain.component,
  projectId: fixtureIds.domain.project,
  name: "Button",
  slug: "button",
  description: "Button component",
  documentPath: "components/button.md",
} satisfies Component;

const template = {
  id: fixtureIds.domain.documentTemplate,
  projectId: fixtureIds.domain.project,
  componentId: fixtureIds.domain.component,
  name: "Button documentation",
  content: "# Button",
} satisfies DocumentTemplate;

const release = {
  id: fixtureIds.domain.release,
  projectId: fixtureIds.domain.project,
  version: "1.0.0",
  status: "published",
  createdAt: "2026-10-27T10:00:00.000Z",
  publishedAt: "2026-10-27T10:00:00.000Z",
} satisfies Release;

const apiKey = {
  id: fixtureIds.domain.apiKey,
  projectId: fixtureIds.domain.project,
  keyIdentifier: "key-id-1",
  keyHash: "hash-only",
  scope: "release:read",
  createdAt: "2026-10-27T10:00:00.000Z",
  expiresAt: "2026-11-27T10:00:00.000Z",
  revokedAt: null,
} satisfies ApiKey;
