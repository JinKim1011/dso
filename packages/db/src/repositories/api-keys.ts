import type { ApiKey } from "@repo/contracts/type";
import type { ApiKeyScope } from "@repo/contracts/validation/enum";

type ApiKeyRow = {
  id: string;
  project_id: string;
  key_identifier: string;
  key_hash: string;
  scope: ApiKeyScope;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
};

export function mapApiKeyRow(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    projectId: row.project_id,
    keyIdentifier: row.key_identifier,
    keyHash: row.key_hash,
    scope: row.scope,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    revokedAt: row.revoked_at?.toISOString() ?? null,
  };
}
