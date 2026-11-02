import { fixtureIds } from "@repo/contracts/fixtures/ids";
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
  projectId: fixtureIds.project,
  referencingTokenId: fixtureIds.modeToken,
  referencedTokenId: fixtureIds.singleToken,
  slot: "light",
} satisfies AddTokenReferenceRequest;

export const changeParentRequest = {
  projectId: fixtureIds.project,
  tokenTypeId: fixtureIds.semanticTokenType,
  parentTypeId: fixtureIds.primitiveTokenType,
} satisfies ChangeTokenTypeParentRequest;

export const publishRequest = {
  projectId: fixtureIds.project,
  releaseId: fixtureIds.release,
} satisfies PublishReleaseRequest;

export const createApiKeyRequest = {
  projectId: fixtureIds.project,
  expiresAt: "2026-11-27T10:00:00.000Z",
  scope: "release:read",
} satisfies CreateApiKeyRequest;

export const revokeApiKeyRequest = {
  projectId: fixtureIds.project,
  apiKeyId: fixtureIds.apiKey,
} satisfies RevokeApiKeyRequest;

export const downloadReleaseRequest = {
  releaseId: fixtureIds.release,
} satisfies DownloadReleaseRequest;

export const updateTokenRequest = {
  projectId: fixtureIds.project,
  tokenId: fixtureIds.modeToken,
  name: "surface",
  cssVar: "--color-surface",
  value: {
    kind: "modes",
    light: "#ffffff",
    dark: "#111111",
  },
} satisfies UpdateTokenRequest;
