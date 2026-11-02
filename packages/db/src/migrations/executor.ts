import type { Migration, MigrationHistoryStore } from "@repo/db/migrations/types";
import type { PoolClient } from "pg";

export async function executeMigration(
  client: PoolClient,
  history: MigrationHistoryStore,
  migration: Migration,
): Promise<void> {
  await client.query("BEGIN");

  try {
    await client.query(migration.sql);
    await history.recordApplied(migration.name);
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        `Migration "${migration.name}" failed and rollback also failed.`,
      );
    }

    throw error;
  }
}
