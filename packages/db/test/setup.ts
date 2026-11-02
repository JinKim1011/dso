import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach } from "vitest";

let database: Pool;

beforeAll(async () => {
  database = await setupDatabase();
});

beforeEach(async () => {
  await resetDatabase(database);
});

afterAll(async () => {
  await closeDatabase();
});

export function getTestDatabase(): Pool {
  return database;
}
