import { hashPassword } from "@repo/application/services/passwords";
import type { SeedData } from "@repo/contracts/seed";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { validateLimitedStringField } from "@repo/contracts/validation/operations/common";
import { validateSeedData } from "@repo/contracts/validation/seed";
import { closeDatabasePool, createDatabasePool } from "@repo/db/client";
import { runMigrations } from "@repo/db/migrations/index";
import { seedDatabase } from "@repo/db/seed";
import { validSeed } from "@repo/seed-data/valid-seed";

async function withSeedUserPasswords(seed: SeedData): Promise<SeedData> {
  const password = process.env.DSO_SEED_USER_PASSWORD;

  if (!password) {
    throw new Error("DSO_SEED_USER_PASSWORD is required so the seeded users can log in.");
  }

  const passwordIssue = validateLimitedStringField(
    password,
    "DSO_SEED_USER_PASSWORD",
    CONTRACT_LIMITS.password,
  );

  if (passwordIssue) {
    throw new Error(passwordIssue.message);
  }

  const passwordHash = await hashPassword(password);

  return { ...seed, users: seed.users.map((user) => ({ ...user, passwordHash })) };
}

async function main(): Promise<void> {
  const validationErrors = validateSeedData(validSeed);

  if (validationErrors.length > 0) {
    throw new Error(
      `Seed validation failed:\n${JSON.stringify(validationErrors, null, 2)}`,
    );
  }

  const seed = await withSeedUserPasswords(validSeed);

  const pool = createDatabasePool();

  try {
    await pool.query("SELECT 1");

    const appliedMigrations = await runMigrations(pool);

    if (appliedMigrations.length > 0) {
      console.log("Applied migrations:", appliedMigrations.join(", "));
    } else {
      console.log("No new migrations to apply.");
    }

    await seedDatabase(pool, seed);

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
