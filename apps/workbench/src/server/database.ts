import { createRuntimeDatabasePool } from "@repo/db/client";

let pool: ReturnType<typeof createRuntimeDatabasePool> | undefined;

export function getDatabasePool() {
  pool ??= createRuntimeDatabasePool();
  return pool;
}
