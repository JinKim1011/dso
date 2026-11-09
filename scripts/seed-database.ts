import { validateSeedData } from "@repo/contracts/validation/seed";
import { closeDatabasePool, createDatabasePool } from "@repo/db/client";
import { runMigrations } from "@repo/db/migrations/index";
import { seedDatabase } from "@repo/db/seed";
import { validSeed } from "@repo/seed-data/valid-seed";

async function main(): Promise<void> {
  const validationErrors = validateSeedData(validSeed);

  if (validationErrors.length > 0) {
    throw new Error(
      `Seed validation failed:\n${JSON.stringify(validationErrors, null, 2)}`,
    );
  }

  const pool = createDatabasePool();

  try {
    await pool.query("SELECT 1");

    const appliedMigrations = await runMigrations(pool);

    if (appliedMigrations.length > 0) {
      console.log("Applied migrations:", appliedMigrations.join(", "));
    } else {
      console.log("No new migrations to apply.");
    }

    await seedDatabase(pool, validSeed);

    console.log("Database seed completed successfully.");
    console.log(`Project: ${validSeed.projects[0]?.name}`);
    console.log(`Token types: ${validSeed.tokenTypes.length}`);
    console.log(`Tokens: ${validSeed.tokens.length}`);
  } finally {
    await closeDatabasePool(pool);
  }
}

main().catch((error: unknown) => {
  console.error("Database seed failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
