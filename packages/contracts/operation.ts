import type {
  Component,
  DocumentTemplate,
  Release,
  Token,
  TokenReference,
  TokenReferenceSlot,
  TokenType,
  TokenValue,
} from "@repo/contracts/type";
import type { ApiKeyScope } from "@repo/contracts/validation/enum";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: {
    id: string;
    email: string;
  };
  expiresAt: string;
};

export type UpdateTokenRequest = {
  projectId: string;
  tokenId: string;
  name: string;
  cssVar: string | null;
  value: TokenValue;
};

export type AddTokenReferenceRequest = {
  projectId: string;
  referencingTokenId: string;
  referencedTokenId: string;
  slot: TokenReferenceSlot;
};

export type ChangeTokenTypeParentRequest = {
  projectId: string;
  tokenTypeId: string;
  parentTypeId: string | null;
};

// The caller’s user identity should come from the authenticated session
// , not from an untrusted request field.
export type PublishReleaseRequest = {
  projectId: string;
  releaseId: string;
};

export type CreateApiKeyRequest = {
  projectId: string;
  expiresAt: string;
  scope: ApiKeyScope;
};

export type CreateApiKeyResponse = {
  apiKey: {
    id: string;
    projectId: string;
    keyIdentifier: string;
    scope: ApiKeyScope;
    expiresAt: string;
  };
  // returned only during creation.
  // it should not be part of the stored ApiKey record, which contains only keyHash.
  secret: string;
};

export type RevokeApiKeyRequest = {
  projectId: string;
  apiKeyId: string;
};

export type DownloadReleaseRequest = {
  releaseId: string;
};

export type PublishedReleaseResponse = {
  schemaVersion: 1;
  release: Release;
  tokenTypes: TokenType[];
  tokens: Token[];
  references: TokenReference[];
  components: Component[];
  templates: DocumentTemplate[];
};
