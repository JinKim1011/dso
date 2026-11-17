import type { AuditEvent } from "@repo/contracts/type";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import {
  isRecord,
  validateUuidField,
} from "@repo/contracts/validation/operations/common";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type AuditEventRow = QueryResultRow & {
  id: string;
  user_id: string | null;
  project_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: unknown;
  created_at: Date;
};

function validateMetadata(action: string, value: unknown): AuditEvent["metadata"] {
  if (action !== "token.batch_saved") {
    if (value !== null && value !== undefined) {
      throw new Error("Metadata is not allowed for this audit action.");
    }

    return undefined;
  }

  if (
    !isRecord(value) ||
    Object.keys(value).length !== 1 ||
    !Object.hasOwn(value, "tokenIds") ||
    !Array.isArray(value.tokenIds) ||
    value.tokenIds.length === 0 ||
    value.tokenIds.length > CONTRACT_LIMITS.collectionItems
  ) {
    throw new Error("Invalid audit token IDs.");
  }

  const tokenIds: string[] = [];

  const seen = new Set<string>();

  for (const tokenId of value.tokenIds) {
    if (typeof tokenId !== "string" || validateUuidField(tokenId, "tokenId")) {
      throw new Error("Invalid audit token IDs.");
    }
    const normalized = tokenId.toLowerCase();
    if (seen.has(normalized)) throw new Error("Invalid audit token IDs.");
    seen.add(normalized);
    tokenIds.push(tokenId);
  }

  return { tokenIds };
}

function mapAuditEventRow(row: AuditEventRow): AuditEvent {
  const metadata = validateMetadata(row.action, row.metadata);

  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id ?? null,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id ?? null,
    ...(metadata && { metadata }),
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertAuditEvent(
  database: Queryable,
  auditEvent: AuditEvent,
): Promise<AuditEvent> {
  const metadata = validateMetadata(auditEvent.action, auditEvent.metadata);

  const result = await database.query<AuditEventRow>(
    `
      INSERT INTO audit_events (id, user_id, project_id, action, resource_type, resource_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, project_id, action, resource_type, resource_id, metadata, created_at
    `,
    [
      auditEvent.id,
      auditEvent.userId,
      auditEvent.projectId,
      auditEvent.action,
      auditEvent.resourceType,
      auditEvent.resourceId,
      metadata ?? null,
      auditEvent.createdAt,
    ],
  );

  return mapAuditEventRow(result.rows[0]!);
}
