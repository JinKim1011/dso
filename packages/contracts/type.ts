import type { SupportedTokenKind } from "@repo/contracts/token-kind";
import type {
  ApiKeyScope,
  ProjectMemberRole,
  ReleaseStatus,
} from "@repo/contracts/validation/enum";

export type Project = {
  id: string;
  name: string;
};

export type ProjectMember = {
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  createdAt: string;
};

export type Release = {
  id: string;
  projectId: string;
  version: string;
  status: ReleaseStatus;
  publishedAt: string | null;
};

export type ApiKey = {
  id: string;
  projectId: string;
  keyIdentifier: string;
  keyHash: string;
  scope: ApiKeyScope;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type TokenType = {
  id: string;
  projectId: string;
  parentTypeId: string | null;
  category: string;
  name: string;
  kind: SupportedTokenKind;
};

export type Token = {
  id: string;
  projectId: string;
  tokenTypeId: string;
  name: string;
  cssVar: string | null;
  value: TokenValue;
};

export type TokenValue =
  | { kind: "single"; value: string }
  | { kind: "modes"; light?: string; dark?: string }
  | { kind: "typography"; fontSize: string; fontWeight: string; lineHeight: string }
  | { kind: "unresolved" };

export type TokenReferenceSlot =
  "value" | "light" | "dark" | "fontSize" | "fontWeight" | "lineHeight";

export type TokenReference = {
  referencingTokenId: string;
  referencedTokenId: string;
  slot: TokenReferenceSlot;
};
