import type { Session } from "@repo/contracts/type";

type SessionRow = {
  id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
};

export function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
}
