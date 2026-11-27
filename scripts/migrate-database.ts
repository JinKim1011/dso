import { closeDatabasePool, createDatabasePool } from "@repo/db/client";
import { loadMigrationDatabaseEnvironment } from "@repo/db/env";
import { runMigrations } from "@repo/db/migrations/index";

async function main(): Promise<void> {
  const environment = loadMigrationDatabaseEnvironment(process.env);
  const pool = createDatabasePool(environment.databaseUrl, environment.poolMax);

  try {
    await pool.query("SELECT 1");
    const applied = await runMigrations(pool);

    if (applied.length === 0) {
      console.log("No new migrations to apply.");
      return;
    }

    console.log("Applied migrations:", applied.join(", "));
  } finally {
    await closeDatabasePool(pool);
  }
}

main().catch((error: unknown) => {
  console.error("Database migration failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
