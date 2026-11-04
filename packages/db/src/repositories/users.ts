import type { User } from "@repo/contracts/type";
import type { Pool, PoolClient, QueryResultRow } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

type UserRow = QueryResultRow & {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
};

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}

export function canonicalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function insertUser(database: Queryable, user: User): Promise<User> {
  const email = canonicalizeEmail(user.email);

  const result = await database.query<UserRow>(
    `
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password_hash, created_at
    `,
    [user.id, email, user.passwordHash, user.createdAt],
  );

  return mapUserRow(result.rows[0]!);
}

export async function findUserByEmail(
  database: Queryable,
  email: string,
): Promise<User | null> {
  const result = await database.query<UserRow>(
    `
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE email = $1
    `,
    [canonicalizeEmail(email)],
  );

  const row = result.rows[0];

  return row ? mapUserRow(row) : null;
}
