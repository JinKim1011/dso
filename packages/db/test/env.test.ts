import { loadDatabaseEnvironment, loadTestDatabaseEnvironment } from "@repo/db/env";
import { describe, expect, it } from "vitest";

describe("loadDatabaseEnvironment", () => {
  it("loads required values and applies the pool default", () => {
    expect(
      loadDatabaseEnvironment({
        DATABASE_URL: "postgres://localhost/dso",
      }),
    ).toEqual({
      databaseUrl: "postgres://localhost/dso",
      poolMax: 10,
    });
  });

  it("parses DB_POOL_MAX", () => {
    expect(
      loadDatabaseEnvironment({
        DATABASE_URL: "postgres://localhost/dso",
        DB_POOL_MAX: "20",
      }),
    ).toEqual({
      databaseUrl: "postgres://localhost/dso",
      poolMax: 20,
    });
  });

  it("rejects a missing database URL", () => {
    expect(() => loadDatabaseEnvironment({})).toThrow("DATABASE_URL is required.");
  });

  it("rejects an invalid pool size", () => {
    expect(() =>
      loadDatabaseEnvironment({
        DATABASE_URL: "postgres://localhost/dso",
        DB_POOL_MAX: "0",
      }),
    ).toThrow("DB_POOL_MAX must be a positive integer.");
  });
});

describe("loadTestDatabaseEnvironment", () => {
  const validEnvironment = {
    DATABASE_URL: "postgres://localhost/dso",
    TEST_DATABASE_URL: "postgres://localhost/dso_test",
  };

  it("loads the test database URL", () => {
    expect(loadTestDatabaseEnvironment(validEnvironment)).toEqual({
      databaseUrl: "postgres://localhost/dso",
      poolMax: 10,
      testDatabaseUrl: "postgres://localhost/dso_test",
    });
  });

  it("rejects a missing test database URL", () => {
    expect(() =>
      loadTestDatabaseEnvironment({
        DATABASE_URL: "postgres://localhost/dso",
      }),
    ).toThrow("TEST_DATABASE_URL is required for database tests.");
  });

  it("rejects using the application database for tests", () => {
    expect(() =>
      loadTestDatabaseEnvironment({
        DATABASE_URL: "postgres://localhost/dso",
        TEST_DATABASE_URL: "postgres://localhost/dso",
      }),
    ).toThrow("TEST_DATABASE_URL must be different from DATABASE_URL.");
  });
});
