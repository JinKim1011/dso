import { createDatabasePool } from "@repo/db/client";

let pool: ReturnType<typeof createDatabasePool> | undefined;

export function getDatabasePool() {
  pool ??= createDatabasePool();
  return pool;
}
