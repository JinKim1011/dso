export const PROJECT_MEMBER_ROLES = ["editor", "publisher", "admin"] as const;
export const API_KEY_SCOPES = ["release:read"] as const;
export const RELEASE_STATUSES = ["draft", "published"] as const;
export const TOKEN_KINDS = ["primitive", "semantic"] as const;

export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];
export type TokenKind = (typeof TOKEN_KINDS)[number];

export function isSupportedProjectMemberRole(value: unknown): value is ProjectMemberRole {
  return (
    typeof value === "string" && PROJECT_MEMBER_ROLES.includes(value as ProjectMemberRole)
  );
}
export function isSupportedApiKeyScope(value: unknown): value is ApiKeyScope {
  return typeof value === "string" && API_KEY_SCOPES.includes(value as ApiKeyScope);
}
export function isSupportedReleaseStatus(value: unknown): value is ReleaseStatus {
  return typeof value === "string" && RELEASE_STATUSES.includes(value as ReleaseStatus);
}
export function isSupportedTokenKind(value: unknown): value is TokenKind {
  return typeof value === "string" && TOKEN_KINDS.includes(value as TokenKind);
}
