import type { User } from "@repo/contracts/type";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
};

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}
