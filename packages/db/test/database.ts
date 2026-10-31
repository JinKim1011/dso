import { createDatabasePool } from "@repo/db/client";
import { runMigrations } from "@repo/db/migrations/index";
import path from "node:path";
import type { Pool } from "pg";

let pool: Pool | undefined;

const migrationsDirectory = path.resolve(
  import.meta.dirname,
  "../../../database/migrations",
);

export async function setupDatabase(): Promise<Pool> {
  pool = createDatabasePool();

  await runMigrations(pool, migrationsDirectory);

  return pool;
}

export async function resetDatabase(database: Pool): Promise<void> {
  await database.query(`
    TRUNCATE TABLE
      audit_events,
      api_keys,
      project_members,
      sessions,
      document_templates,
      components,
      token_references,
      tokens,
      token_types,
      releases,
      projects,
      users
    RESTART IDENTITY CASCADE
  `);
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
