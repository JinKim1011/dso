import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { seedDatabase } from "@repo/db/seed";
import { getTestDatabase } from "@repo/db/test/setup";
import { describe, expect, it } from "vitest";

const tableNames = [
  "users",
  "projects",
  "project_members",
  "token_types",
  "tokens",
  "token_references",
  "components",
  "document_templates",
  "releases",
] as const;

type SeedCollection =
  | "users"
  | "projects"
  | "projectMembers"
  | "tokenTypes"
  | "tokens"
  | "tokenReferences"
  | "components"
  | "documentTemplates"
  | "releases";

async function countRows(tableName: string): Promise<number> {
  const result = await getTestDatabase().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${tableName}`,
  );

  return Number(result.rows[0]!.count);
}

async function countAllTables(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const tableName of tableNames) {
    counts[tableName] = await countRows(tableName);
  }

  return counts;
}

function expectedSeedCounts(): Record<SeedCollection, number> {
  return {
    users: validSeed.users.length,
    projects: validSeed.projects.length,
    projectMembers: validSeed.projectMembers.length,
    tokenTypes: validSeed.tokenTypes.length,
    tokens: validSeed.tokens.length,
    tokenReferences: validSeed.tokenReferences.length,
    components: validSeed.components.length,
    documentTemplates: validSeed.documentTemplates.length,
    releases: validSeed.releases.length,
  };
}

describe("seedDatabase", () => {
  it("inserts a complete valid seed successfully", async () => {
    const database = getTestDatabase();

    await expect(
      seedDatabase(database, structuredClone(validSeed)),
    ).resolves.toBeUndefined();

    expect(await countAllTables()).toEqual({
      users: validSeed.users.length,
      projects: validSeed.projects.length,
      project_members: validSeed.projectMembers.length,
      token_types: validSeed.tokenTypes.length,
      tokens: validSeed.tokens.length,
      token_references: validSeed.tokenReferences.length,
      components: validSeed.components.length,
      document_templates: validSeed.documentTemplates.length,
      releases: validSeed.releases.length,
    });
  });

  it("rejects invalid seed data before any database write", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    seed.users[0]!.email = "not-an-email";

    await expect(seedDatabase(database, seed)).rejects.toThrow("Seed validation failed");

    expect(await countAllTables()).toEqual({
      users: 0,
      projects: 0,
      project_members: 0,
      token_types: 0,
      tokens: 0,
      token_references: 0,
      components: 0,
      document_templates: 0,
      releases: 0,
    });
  });

  it("rolls back all seed rows when a database failure occurs", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    // The validator permits distinct projects with the same slug.
    // PostgreSQL rejects the second insert through the unique constraint.
    seed.projects.push({
      ...seed.projects[0]!,
      id: crypto.randomUUID(),
      name: "Duplicate Slug Project",
    });

    await expect(seedDatabase(database, seed)).rejects.toSatisfy(
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505",
    );

    expect(await countAllTables()).toEqual({
      users: 0,
      projects: 0,
      project_members: 0,
      token_types: 0,
      tokens: 0,
      token_references: 0,
      components: 0,
      document_templates: 0,
      releases: 0,
    });
  });

  it("creates exactly one row for every seed item", async () => {
    const database = getTestDatabase();

    await seedDatabase(database, structuredClone(validSeed));

    const actualCounts = {
      users: await countRows("users"),
      projects: await countRows("projects"),
      projectMembers: await countRows("project_members"),
      tokenTypes: await countRows("token_types"),
      tokens: await countRows("tokens"),
      tokenReferences: await countRows("token_references"),
      components: await countRows("components"),
      documentTemplates: await countRows("document_templates"),
      releases: await countRows("releases"),
    };

    expect(actualCounts).toEqual(expectedSeedCounts());
  });

  it("rejects re-running the same seed", async () => {
    const database = getTestDatabase();

    await seedDatabase(database, structuredClone(validSeed));

    await expect(seedDatabase(database, structuredClone(validSeed))).rejects.toSatisfy(
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505",
    );

    // The original seed remains intact; the failed second run is rolled back.
    expect(await countAllTables()).toEqual({
      users: validSeed.users.length,
      projects: validSeed.projects.length,
      project_members: validSeed.projectMembers.length,
      token_types: validSeed.tokenTypes.length,
      tokens: validSeed.tokens.length,
      token_references: validSeed.tokenReferences.length,
      components: validSeed.components.length,
      document_templates: validSeed.documentTemplates.length,
      releases: validSeed.releases.length,
    });
  });
});
