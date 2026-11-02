import { Pool } from "pg";

function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  return connectionString;
}

export function createDatabasePool(connectionString = getDatabaseUrl()): Pool {
  return new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 10),
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
