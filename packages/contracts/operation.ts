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

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type LoginResponse = {
  user: AuthenticatedUser;
  expiresAt: string;
};

export type SessionLookupResponse = {
  user: AuthenticatedUser;
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
  credential: string;
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
} & PublishedReleaseSnapshot;

export type PublishedReleaseSnapshot = {
  tokenTypes: TokenType[];
  tokens: Token[];
  references: TokenReference[];
  components: Component[];
  templates: DocumentTemplate[];
};

export type ReferenceChange = {
  slot: TokenReferenceSlot;
  beforeTokenId: string | null;
  afterTokenId: string | null;
};

export type StagedTokenChange = {
  tokenId: string;
  name?: {
    before: string;
    after: string;
  };
  value?: {
    before: TokenValue;
    after: TokenValue;
  };
  references: ReferenceChange[];
};

export type SaveStagedChangesRequest = {
  projectId: string;
  changes: StagedTokenChange[];
};

export type SaveStagedChangesResponse =
  | { ok: true; tokens: Token[]; references: TokenReference[] }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        correlationId?: string;
        issues?: readonly {
          code: string;
          message: string;
          field?: string;
          tokenId?: string;
          referencedTokenId?: string;
        }[];
      };
    };

export type PublishStagedChangesResult = {
  release: Release;
  tokens: Token[];
  references: TokenReference[];
};

export type PublishStagedChangesResponse =
  | ({ ok: true } & PublishStagedChangesResult)
  | Extract<SaveStagedChangesResponse, { ok: false }>;
