import { insertAuditEvent } from "@repo/db/repositories/audit-events";
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
import { insertUser } from "@repo/db/repositories/users";
import { getTestDatabase } from "@repo/db/test/setup";
import type { AuditEvent } from "@repo/contracts/type";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { seedIds } from "@repo/seed-data/ids";
import { validSeed } from "@repo/seed-data/valid-seed";
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

describe("database audit events repository", () => {
  const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const tokenId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  async function seedAuditScope() {
    const database = getTestDatabase();
    await insertUser(database, {
      id: userId,
      email: "audit@example.test",
      passwordHash: "test-hash",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await insertProject(database, validSeed.projects[0]!);
  }

  function batch(): AuditEvent {
    return {
      id: crypto.randomUUID(),
      userId,
      projectId: validSeed.projects[0]!.id,
      action: "token.batch_saved",
      resourceType: "token_batch",
      resourceId: null,
      metadata: { tokenIds: [tokenId] },
      createdAt: "2026-01-01T00:00:00.000Z",
    };
  }

  it("persists batch metadata and a failed login with an unknown actor", async () => {
    await seedAuditScope();
    const database = getTestDatabase();
    const saved = batch();
    expect(await insertAuditEvent(database, saved)).toEqual(saved);

    const failedLogin: AuditEvent = {
      id: crypto.randomUUID(),
      userId: null,
      projectId: null,
      action: "login.failed",
      resourceType: "account",
      resourceId: userId,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(await insertAuditEvent(database, failedLogin)).toEqual(failedLogin);
  });

  it("accepts the maximum number of unique token IDs", async () => {
    await seedAuditScope();
    const saved = batch();
    saved.metadata = {
      tokenIds: Array.from({ length: CONTRACT_LIMITS.collectionItems }, () =>
        crypto.randomUUID(),
      ),
    };
    expect(await insertAuditEvent(getTestDatabase(), saved)).toEqual(saved);
  });

  it("rejects malformed, oversized, duplicate, or sensitive metadata before insertion", async () => {
    await seedAuditScope();
    const database = getTestDatabase();
    const invalidMetadata: unknown[] = [
      null,
      {},
      [],
      "not-an-object",
      42,
      { tokenIds: null },
      { tokenIds: "not-an-array" },
      { tokenIds: [] },
      { tokenIds: [null] },
      { tokenIds: [42] },
      { tokenIds: ["not-a-uuid"] },
      { tokenIds: [tokenId, tokenId.toUpperCase()] },
      { tokenIds: [tokenId], password: "secret" },
      {
        tokenIds: Array.from({ length: CONTRACT_LIMITS.collectionItems + 1 }, () =>
          crypto.randomUUID(),
        ),
      },
    ];
    for (const metadata of invalidMetadata) {
      const event = batch();
      Reflect.set(event, "metadata", metadata);
      await expect(insertAuditEvent(database, event)).rejects.toThrow("Invalid audit token IDs.");
    }
    const result = await database.query("SELECT COUNT(*)::int AS count FROM audit_events");
    expect(result.rows[0].count).toBe(0);
  });

  it("rejects metadata on other audit actions", async () => {
    await seedAuditScope();
    const event: AuditEvent = {
      ...batch(),
      projectId: null,
      action: "login.succeeded",
      resourceType: "account",
    };
    await expect(insertAuditEvent(getTestDatabase(), event)).rejects.toThrow(
      "Metadata is not allowed for this audit action.",
    );
  });
});

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

    expect(await findReleaseById(database, seedIds.release)).toEqual(seed.releases[0]);
  });

  it("lists only published releases", async () => {
    const database = getTestDatabase();
    const project = validSeed.projects[0]!;

    await insertProject(database, project);

    await insertRelease(database, validSeed.releases[0]!);

    await insertRelease(database, {
      ...validSeed.releases[0]!,
      id: crypto.randomUUID(),
      version: "2",
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
