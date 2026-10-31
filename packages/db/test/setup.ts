import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { closeDatabase, resetDatabase, setupDatabase } from "./database";

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
