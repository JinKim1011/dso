import type {
  AddTokenReferenceRequest,
  ChangeTokenTypeParentRequest,
  CreateApiKeyRequest,
  LoginRequest,
  PublishReleaseRequest,
} from "@repo/contracts/operation";

const loginRequest = {
  email: "developer@example.test",
  password: "not-a-real-password",
} satisfies LoginRequest;

const addReferenceRequest = {
  projectId: "project-1",
  referencingTokenId: "token-surface",
  referencedTokenId: "token-white",
  slot: "light",
} satisfies AddTokenReferenceRequest;

const changeParentRequest = {
  projectId: "project-1",
  tokenTypeId: "token-type-semantic",
  parentTypeId: "token-type-base",
} satisfies ChangeTokenTypeParentRequest;

const publishRequest = {
  projectId: "project-1",
  releaseId: "release-1",
} satisfies PublishReleaseRequest;

const createApiKeyRequest = {
  projectId: "project-1",
  expiresAt: "2026-11-27T10:00:00Z",
  scope: "release:read",
} satisfies CreateApiKeyRequest;
