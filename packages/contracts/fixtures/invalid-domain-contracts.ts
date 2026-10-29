import type {
  ApiKey,
  ProjectMember,
  Release,
  Token,
  TokenType,
} from "@repo/contracts/type";

const invalidRelease: Release = {
  id: "release-1",
  projectId: "project-1",
  version: "1.0.0",
  // @ts-expect-error Only draft and published are supported.
  status: "archived",
  publishedAt: null,
};

const invalidTokenType: TokenType = {
  id: "type-1",
  projectId: "project-1",
  parentTypeId: null,
  category: "color",
  name: "Base",
  // @ts-expect-error Legacy and unsupported kinds are not domain kinds.
  kind: "class-union",
};

const invalidUnknownTokenType: TokenType = {
  id: "type-2",
  projectId: "project-1",
  parentTypeId: null,
  category: "color",
  name: "Unknown",
  // @ts-expect-error unknown is not a supported token kind.
  kind: "unknown",
};

const invalidMember: ProjectMember = {
  projectId: "project-1",
  userId: "user-1",
  // @ts-expect-error Only editor, publisher, and admin are valid roles.
  role: "owner",
  createdAt: "2026-10-27T10:00:00.000Z",
};

const invalidApiKey: ApiKey = {
  id: "key-1",
  projectId: "project-1",
  keyIdentifier: "key-id-1",
  keyHash: "hash-only",
  // @ts-expect-error Only release:read is currently supported.
  scope: "project:write",
  createdAt: "2026-10-27T10:00:00.000Z",
  expiresAt: "2026-11-27T10:00:00Z",
  revokedAt: null,
};

const invalidToken: Token = {
  id: "token-1",
  projectId: "project-1",
  tokenTypeId: "type-1",
  name: "invalid-token",
  cssVar: null,
  value: {
    // @ts-expect-error Token values must use a supported discriminant.
    kind: "gradient",
    value: "linear-gradient(red, blue)",
  },
};
