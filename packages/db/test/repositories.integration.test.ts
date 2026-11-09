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
  listTokenTypeHierarchy,
  listTokenTypesByProjectId,
} from "@repo/db/repositories/token-types";
import { insertToken, listTokensByProjectId } from "@repo/db/repositories/tokens";
import { getTestDatabase } from "@repo/db/test/setup";
import { describe, expect, it } from "vitest";

function findTokenType(
  seed: typeof validSeed,
  name: string,
  kind: "primitive" | "semantic",
) {
  const tokenType = seed.tokenTypes.find(
    (item) => item.name === name && item.kind === kind,
  );

  if (!tokenType) {
    throw new Error(`Missing token type: ${kind}/${name}`);
  }

  return tokenType;
}

function findToken(seed: typeof validSeed, name: string, tokenTypeId: string) {
  const token = seed.tokens.find(
    (item) => item.name === name && item.tokenTypeId === tokenTypeId,
  );

  if (!token) {
    throw new Error(`Missing token: ${tokenTypeId}/${name}`);
  }

  return token;
}

describe("database projects repository", () => {
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

describe("database token types repository", () => {
  it("inserts token types, tokens, and references", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    const primitiveType = findTokenType(seed, "Base", "primitive");
    const semanticType = findTokenType(seed, "surface", "semantic");

    const lightToken = findToken(seed, "neutral-0", primitiveType.id);
    const darkToken = findToken(seed, "neutral-900", primitiveType.id);

    await insertProject(database, seed.projects[0]!);
    await insertTokenType(database, primitiveType);
    await insertTokenType(database, semanticType);
    await insertToken(database, darkToken);
    await insertToken(database, lightToken);

    expect(await listTokenTypesByProjectId(database, seed.projects[0]!.id)).toHaveLength(
      2,
    );

    expect(await listTokensByProjectId(database, seed.projects[0]!.id)).toHaveLength(2);

    expect(await listTokenReferencesByProjectId(database, seed.projects[0]!.id)).toEqual(
      [],
    );
  });

  it("lists the token type hierarchy", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertTokenType(database, seed.tokenTypes[0]!);
    await insertTokenType(database, seed.tokenTypes[1]!);

    const hierarchy = await listTokenTypeHierarchy(database, seed.projects[0]!.id);

    expect(hierarchy).toEqual(
      expect.arrayContaining([seed.tokenTypes[0], seed.tokenTypes[1]]),
    );
    expect(hierarchy).toHaveLength(2);
  });
});

describe("database releases repository", () => {
  it("inserts and reads a published release", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertRelease(database, seed.releases[0]!);

    expect(await findReleaseById(database, fixtureIds.seed.release)).toEqual(seed.releases[0]);
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

describe("database token references repository", () => {
  it("lists tokens that reference a target token", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    const project = seed.projects[0]!;

    const semanticType = findTokenType(seed, "surface", "semantic");

    const semanticToken = seed.tokens.find(
      (token) => token.name === "surface" && token.tokenTypeId === semanticType.id,
    )!;
    const lightReference = seed.tokenReferences.find(
      (reference) =>
        reference.referencingTokenId === semanticToken.id && reference.slot === "light",
    )!;

    const darkReference = seed.tokenReferences.find(
      (reference) =>
        reference.referencingTokenId === semanticToken.id && reference.slot === "dark",
    )!;

    const lightToken = seed.tokens.find(
      (token) => token.id === lightReference.referencedTokenId,
    )!;
    const darkToken = seed.tokens.find(
      (token) => token.id === darkReference.referencedTokenId,
    )!;
    const primitiveType = seed.tokenTypes.find(
      (tokenType) => tokenType.id === darkToken.tokenTypeId,
    )!;

    await insertProject(database, project);

    await insertTokenType(database, primitiveType);
    await insertTokenType(database, semanticType);

    await insertToken(database, darkToken);
    await insertToken(database, lightToken);
    await insertToken(database, semanticToken);

    const insertedLightReference = await insertTokenReference(database, lightReference);
    const insertedDarkReference = await insertTokenReference(database, darkReference);

    expect(insertedLightReference).toEqual(lightReference);
    expect(insertedDarkReference).toEqual(darkReference);

    expect(await listTokenReferencesToToken(database, project.id, lightToken.id)).toEqual(
      [lightReference],
    );

    expect(await listTokenReferencesToToken(database, project.id, darkToken.id)).toEqual([
      darkReference,
    ]);
  });
});
