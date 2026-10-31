import type { PoolClient } from "pg";

const MIGRATION_LOCK_ID = 742391;

export async function acquireMigrationLock(client: PoolClient): Promise<void> {
  await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
}

export async function releaseMigrationLock(client: PoolClient): Promise<void> {
  await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
}
