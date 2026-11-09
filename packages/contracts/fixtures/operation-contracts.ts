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
  projectId: fixtureIds.domain.project,
  referencingTokenId: fixtureIds.domain.modeToken,
  referencedTokenId: fixtureIds.domain.singleToken,
  slot: "light",
} satisfies AddTokenReferenceRequest;

export const changeParentRequest = {
  projectId: fixtureIds.domain.project,
  tokenTypeId: fixtureIds.domain.semanticTokenType,
  parentTypeId: fixtureIds.domain.primitiveTokenType,
} satisfies ChangeTokenTypeParentRequest;

export const publishRequest = {
  projectId: fixtureIds.domain.project,
  releaseId: fixtureIds.domain.release,
} satisfies PublishReleaseRequest;

export const createApiKeyRequest = {
  projectId: fixtureIds.domain.project,
  expiresAt: "2026-11-27T10:00:00.000Z",
  scope: "release:read",
} satisfies CreateApiKeyRequest;

export const revokeApiKeyRequest = {
  projectId: fixtureIds.domain.project,
  apiKeyId: fixtureIds.domain.apiKey,
} satisfies RevokeApiKeyRequest;

export const downloadReleaseRequest = {
  releaseId: fixtureIds.domain.release,
} satisfies DownloadReleaseRequest;

export const updateTokenRequest = {
  projectId: fixtureIds.domain.project,
  tokenId: fixtureIds.domain.modeToken,
  name: "surface",
  cssVar: "--color-surface",
  value: {
    kind: "modes",
    light: "#ffffff",
    dark: "#111111",
  },
} satisfies UpdateTokenRequest;
