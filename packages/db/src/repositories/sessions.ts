import type { Session } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type SessionRow = QueryResultRow & {
  id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
};

function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
}

export async function insertSession(
  database: Queryable,
  session: Session,
): Promise<Session> {
  const result = await database.query<SessionRow>(
    `
      INSERT INTO sessions (id, user_id, created_at, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, created_at, expires_at
    `,
    [session.id, session.userId, session.createdAt, session.expiresAt],
  );

  return mapSessionRow(result.rows[0]!);
}

export async function findActiveSessionById(
  database: Queryable,
  sessionId: string,
): Promise<Session | null> {
  const result = await database.query<SessionRow>(
    `
      SELECT id, user_id, created_at, expires_at
      FROM sessions
      WHERE id = $1
        AND expires_at > NOW()
    `,
    [sessionId],
  );

  const row = result.rows[0];

  return row ? mapSessionRow(row) : null;
}
