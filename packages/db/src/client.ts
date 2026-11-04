import { loadDatabaseEnvironment } from "@repo/db/env";
import { Pool } from "pg";

export function createDatabasePool(
  connectionString = loadDatabaseEnvironment(process.env).databaseUrl,
): Pool {
  const environment = loadDatabaseEnvironment(process.env);

  return new Pool({
    connectionString,
    max: environment.poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export async function checkDatabaseConnection(pool: Pool): Promise<void> {
  await pool.query("SELECT 1");
}

export async function closeDatabasePool(pool: Pool): Promise<void> {
  await pool.end();
}
