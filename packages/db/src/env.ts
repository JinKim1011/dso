export type DatabaseEnvironment = {
  databaseUrl: string;
  poolMax: number;
};

export type TestDatabaseEnvironment = DatabaseEnvironment & {
  testDatabaseUrl: string;
};

function loadPoolMax(env: NodeJS.ProcessEnv): number {
  const poolMax = Number(env.DB_POOL_MAX ?? "10");

  if (!Number.isInteger(poolMax) || poolMax <= 0) {
    throw new Error("DB_POOL_MAX must be a positive integer.");
  }

  return poolMax;
}

export function loadRuntimeDatabaseEnvironment(
  env: NodeJS.ProcessEnv,
): DatabaseEnvironment {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  return {
    databaseUrl: env.DATABASE_URL,
    poolMax: loadPoolMax(env),
  };
}

export function loadMigrationDatabaseEnvironment(
  env: NodeJS.ProcessEnv,
): DatabaseEnvironment {
  if (!env.DIRECT_DATABASE_URL) {
    throw new Error("DIRECT_DATABASE_URL is required for migrations.");
  }

  return {
    databaseUrl: env.DIRECT_DATABASE_URL,
    poolMax: loadPoolMax(env),
  };
}

export function loadTestDatabaseEnvironment(
  env: NodeJS.ProcessEnv,
): TestDatabaseEnvironment {
  const database = loadRuntimeDatabaseEnvironment(env);
  const testDatabaseUrl = env.TEST_DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for database tests.");
  }

  if (testDatabaseUrl === database.databaseUrl) {
    throw new Error("TEST_DATABASE_URL must be different from DATABASE_URL.");
  }

  return {
    ...database,
    testDatabaseUrl,
  };
}
