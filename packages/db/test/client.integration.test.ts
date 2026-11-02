import {
  checkDatabaseConnection,
  closeDatabasePool,
} from "@repo/db/client";
import { createTestDatabasePool } from "@repo/db/test/database";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let pool: Pool;

describe("database connection", () => {
  beforeAll(async () => {
    pool = createTestDatabasePool();
  });

  afterAll(async () => {
    await closeDatabasePool(pool);
  });

  it("connects to PostgreSQL", async () => {
    await expect(checkDatabaseConnection(pool)).resolves.toBeUndefined();
  });

  it("can execute a parameterized query", async () => {
    const result = await pool.query<{ value: number }>(
      "SELECT $1::integer AS value",
      [42],
    );

    expect(result.rows).toEqual([{ value: 42 }]);
  });
});
