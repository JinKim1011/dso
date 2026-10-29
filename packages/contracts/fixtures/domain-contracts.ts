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
  id: "project-1",
  slug: "design-system",
  name: "Design System",
  createdAt: "2026-10-27T10:00:00Z",
} satisfies Project;

const user = {
  id: "user-1",
  email: "developer@example.test",
  passwordHash: "hash-only",
  createdAt: "2026-10-27T10:00:00Z",
} satisfies User;

const member = {
  projectId: project.id,
  userId: user.id,
  role: "publisher",
  createdAt: "2026-10-27T10:00:00Z",
} satisfies ProjectMember;

const session = {
  id: "session-1",
  userId: user.id,
  createdAt: "2026-10-27T10:00:00Z",
  expiresAt: "2026-10-27T18:00:00Z",
} satisfies Session;

export const baseColorType = {
  id: "token-type-base",
  projectId: project.id,
  parentTypeId: null,
  category: "color",
  name: "Base",
  kind: "primitive",
} satisfies TokenType;

export const semanticColorType = {
  id: "token-type-semantic",
  projectId: project.id,
  parentTypeId: baseColorType.id,
  category: "color",
  name: "Semantic",
  kind: "semantic",
} satisfies TokenType;

export const baseColorToken = {
  id: "token-white",
  projectId: project.id,
  tokenTypeId: baseColorType.id,
  name: "white",
  cssVar: "--color-white",
  value: {
    kind: "single",
    value: "#ffffff",
  },
} satisfies Token;

export const surfaceToken = {
  id: "token-surface",
  projectId: project.id,
  tokenTypeId: semanticColorType.id,
  name: "surface",
  cssVar: "--color-surface",
  value: {
    kind: "modes",
    light: "#ffffff",
    dark: "#111111",
  },
} satisfies Token;

const reference = {
  projectId: project.id,
  referencingTokenId: surfaceToken.id,
  referencedTokenId: baseColorToken.id,
  slot: "light",
} satisfies TokenReference;

const component = {
  id: "component-button",
  projectId: project.id,
  name: "Button",
  slug: "button",
  description: "Button component",
  documentPath: "components/button.md",
} satisfies Component;

const template = {
  id: "template-button",
  projectId: project.id,
  componentId: component.id,
  name: "Button documentation",
  content: "# Button",
} satisfies DocumentTemplate;

const release = {
  id: "release-1",
  projectId: project.id,
  version: "1.0.0",
  status: "published",
  createdAt: "2026-10-27T10:00:00Z",
  publishedAt: "2026-10-27T10:00:00Z",
} satisfies Release;

const apiKey = {
  id: "key-1",
  projectId: project.id,
  keyIdentifier: "key-id-1",
  keyHash: "hash-only",
  scope: "release:read",
  createdAt: "2026-10-27T10:00:00Z",
  expiresAt: "2026-11-27T10:00:00Z",
  revokedAt: null,
} satisfies ApiKey;
