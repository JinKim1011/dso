import { fixtureIds } from "@repo/contracts/fixtures/ids";
import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { findProjectById, insertProject } from "@repo/db/repositories/projects";
import {
  insertTokenReference,
  listTokenReferencesByProjectId,
  listTokenReferencesToToken,
} from "@repo/db/repositories/references";
import {
  findReleaseById,
  insertRelease,
  listPublishedReleasesByProjectId,
} from "@repo/db/repositories/releases";
import {
  insertTokenType,
  listTokenTypesByProjectId,
} from "@repo/db/repositories/token-types";
import { insertToken, listTokensByProjectId } from "@repo/db/repositories/tokens";
import { describe, expect, it } from "vitest";
import { getTestDatabase } from "./setup";

describe("porjects repository", () => {
  it("inserts and reads a project", async () => {
    const database = getTestDatabase();
    const project = validSeed.projects[0]!;

    const inserted = await insertProject(database, project);
    const found = await findProjectById(database, project.id);

    expect(inserted).toMatchObject(project);
    expect(found).toMatchObject(project);
  });

  it("returns null for a missing project", async () => {
    const result = await findProjectById(
      getTestDatabase(),
      "00000000-0000-0000-0000-000000000001",
    );

    expect(result).toBeNull();
  });

  it("returns an empty collection for a project with no tokens", async () => {
    const project = {
      ...validSeed.projects[0]!,
      id: crypto.randomUUID(),
      slug: "empty-project",
      name: "Empty Project",
    };

    await insertProject(getTestDatabase(), project);

    expect(await listTokensByProjectId(getTestDatabase(), project.id)).toEqual([]);
  });

  it("treats SQL-like project IDs as values", async () => {
    const result = await findProjectById(getTestDatabase(), "' OR 1 = 1 --");

    expect(result).toBeNull();
  });

  it("does not execute SQL supplied as a project value", async () => {
    const database = getTestDatabase();

    await insertProject(database, {
      ...validSeed.projects[0]!,
      id: crypto.randomUUID(),
      slug: "safe-slug",
      name: "Safe Project",
    });

    const result = await database.query("SELECT id FROM projects WHERE slug = $1", [
      "' OR 1=1 --",
    ]);

    expect(result.rows).toEqual([]);
  });
});

describe("token types repository", () => {
  it("inserts token types, tokens, and references", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertTokenType(database, seed.tokenTypes[0]!);
    await insertTokenType(database, seed.tokenTypes[1]!);
    await insertToken(database, seed.tokens[0]!);
    await insertToken(database, seed.tokens[1]!);
    await insertTokenReference(database, seed.tokenReferences[0]!);

    expect(await listTokenTypesByProjectId(database, seed.projects[0]!.id)).toHaveLength(
      2,
    );

    expect(await listTokensByProjectId(database, seed.projects[0]!.id)).toHaveLength(2);

    expect(await listTokenReferencesByProjectId(database, seed.projects[0]!.id)).toEqual([
      seed.tokenReferences[0],
    ]);
  });
});

describe("releases repository", () => {
  it("inserts and reads a published release", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertRelease(database, seed.releases[0]!);

    expect(await findReleaseById(database, fixtureIds.release)).toEqual(seed.releases[0]);
  });

  it("lists only published releases", async () => {
    const database = getTestDatabase();
    const project = validSeed.projects[0]!;

    await insertProject(database, project);

    await insertRelease(database, validSeed.releases[0]!);

    await insertRelease(database, {
      ...validSeed.releases[0]!,
      id: crypto.randomUUID(),
      version: "2.0.0",
      status: "draft",
      publishedAt: null,
    });

    const releases = await listPublishedReleasesByProjectId(database, project.id);

    expect(releases).toHaveLength(1);
    expect(releases[0]?.status).toBe("published");
  });
});

describe("token references repository", () => {
  it("lists tokens that reference a target token", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertTokenType(database, seed.tokenTypes[0]!);
    await insertTokenType(database, seed.tokenTypes[1]!);
    await insertToken(database, seed.tokens[0]!);
    await insertToken(database, seed.tokens[1]!);
    await insertTokenReference(database, seed.tokenReferences[0]!);

    const references = await listTokenReferencesToToken(
      database,
      seed.projects[0]!.id,
      seed.tokens[0]!.id,
    );

    expect(references).toEqual([seed.tokenReferences[0]]);
  });
});
