import type { MigrationHistoryStore } from "@repo/db/migrations/types";
import type { PoolClient } from "pg";

export function createMigrationHistoryStore(client: PoolClient): MigrationHistoryStore {
  return {
    async ensureTable(): Promise<void> {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    },

    async getApplied(): Promise<Set<string>> {
      const result = await client.query<{ name: string }>(
        "SELECT name FROM migration_history",
      );

      return new Set(result.rows.map((row) => row.name));
    },

    async recordApplied(name: string): Promise<void> {
      await client.query(
        `
          INSERT INTO migration_history (name)
          VALUES ($1)
        `,
        [name],
      );
    },
  };
}
