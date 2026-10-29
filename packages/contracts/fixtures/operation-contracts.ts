import type {
  AddTokenReferenceRequest,
  ChangeTokenTypeParentRequest,
  CreateApiKeyRequest,
  DownloadReleaseRequest,
  LoginRequest,
  PublishReleaseRequest,
  RevokeApiKeyRequest,
  UpdateTokenRequest,
} from "@repo/contracts/operation";

export const loginRequest = {
  email: "developer@example.test",
  password: "not-a-real-password",
} satisfies LoginRequest;

export const addReferenceRequest = {
  projectId: "project-1",
  referencingTokenId: "token-surface",
  referencedTokenId: "token-white",
  slot: "light",
} satisfies AddTokenReferenceRequest;

export const changeParentRequest = {
  projectId: "project-1",
  tokenTypeId: "token-type-semantic",
  parentTypeId: "token-type-base",
} satisfies ChangeTokenTypeParentRequest;

export const publishRequest = {
  projectId: "project-1",
  releaseId: "release-1",
} satisfies PublishReleaseRequest;

export const createApiKeyRequest = {
  projectId: "project-1",
  expiresAt: "2026-11-27T10:00:00Z",
  scope: "release:read",
} satisfies CreateApiKeyRequest;

export const revokeApiKeyRequest = {
  projectId: "project-1",
  apiKeyId: "key-1",
} satisfies RevokeApiKeyRequest;

export const downloadReleaseRequest = {
  releaseId: "release-1",
} satisfies DownloadReleaseRequest;

export const updateTokenRequest = {
  projectId: "project-1",
  tokenId: "token-surface",
  name: "surface",
  cssVar: "--color-surface",
  value: {
    kind: "modes",
    light: "#ffffff",
    dark: "#111111",
  },
} satisfies UpdateTokenRequest;
