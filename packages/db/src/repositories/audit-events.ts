import type { AuditEvent } from "@repo/contracts/type";

type AuditEventRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: Date;
};

export function mapAuditEventRow(row: AuditEventRow): AuditEvent {
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
