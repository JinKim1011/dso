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

export async function insertUser(database: Queryable, user: User): Promise<User> {
  const result = await database.query<UserRow>(
    `
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password_hash, created_at
    `,
    [user.id, user.email, user.passwordHash, user.createdAt],
  );

  return mapUserRow(result.rows[0]!);
}
