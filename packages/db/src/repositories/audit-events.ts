import type { AuditEvent } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type AuditEventRow = QueryResultRow & {
  id: string;
  user_id: string;
  project_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: Date;
};

function mapAuditEventRow(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id ?? null,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function insertAuditEvent(
  database: Queryable,
  auditEvent: AuditEvent,
): Promise<AuditEvent> {
  const result = await database.query<AuditEventRow>(
    `
      INSERT INTO audit_events (id, user_id, project_id, action, resource_type, resource_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, project_id, action, resource_type, resource_id, created_at
    `,
    [
      auditEvent.id,
      auditEvent.userId,
      auditEvent.projectId,
      auditEvent.action,
      auditEvent.resourceType,
      auditEvent.resourceId,
      auditEvent.createdAt,
    ],
  );

  return mapAuditEventRow(result.rows[0]);
}
