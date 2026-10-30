import type { ApiKey } from "@repo/contracts/type";
import type { ApiKeyScope } from "@repo/contracts/validation/enum";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type ApiKeyRow = QueryResultRow & {
  id: string;
  project_id: string;
  key_identifier: string;
  key_hash: string;
  scope: ApiKeyScope;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
};

function mapApiKeyRow(row: ApiKeyRow): ApiKey {
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

export async function insertApiKey(database: Queryable, apiKey: ApiKey): Promise<ApiKey> {
  const result = await database.query<ApiKeyRow>(
    `
      INSERT INTO api_keys (id, project_id, key_identifier, key_hash, scope, created_at, expires_at, revoked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, project_id, key_identifier, key_hash, scope, created_at, expires_at, revoked_at
    `,
    [
      apiKey.id,
      apiKey.projectId,
      apiKey.keyIdentifier,
      apiKey.keyHash,
      apiKey.scope,
      apiKey.createdAt,
      apiKey.expiresAt,
      apiKey.revokedAt,
    ],
  );

  return mapApiKeyRow(result.rows[0]);
}
