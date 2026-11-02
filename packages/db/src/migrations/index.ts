import { executeMigration } from "@repo/db/migrations/executor";
import { createMigrationHistoryStore } from "@repo/db/migrations/history";
import { loadMigrations } from "@repo/db/migrations/loader";
import { acquireMigrationLock, releaseMigrationLock } from "@repo/db/migrations/lock";
import path from "node:path";
import type { Pool } from "pg";

const DEFAULT_DIRECTORY = path.resolve(process.cwd(), "database", "migrations");

export async function runMigrations(
  pool: Pool,
  directory = DEFAULT_DIRECTORY,
): Promise<string[]> {
  const client = await pool.connect();

  try {
    await acquireMigrationLock(client);

    const history = createMigrationHistoryStore(client);
    await history.ensureTable();

    const migrations = await loadMigrations(directory);
    const applied = await history.getApplied();
    const newlyApplied: string[] = [];

    for (const migration of migrations) {
      if (applied.has(migration.name)) {
        continue;
      }

      await executeMigration(client, history, migration);
      newlyApplied.push(migration.name);
    }

    return newlyApplied;
  } finally {
    try {
      await releaseMigrationLock(client);
    } finally {
      client.release();
    }
  }
}
