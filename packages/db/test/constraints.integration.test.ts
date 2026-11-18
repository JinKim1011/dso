import { insertProject } from "@repo/db/repositories/projects";
import { insertTokenReference } from "@repo/db/repositories/references";
import { insertRelease } from "@repo/db/repositories/releases";
import { insertTokenType } from "@repo/db/repositories/token-types";
import { insertToken } from "@repo/db/repositories/tokens";
import { insertUser } from "@repo/db/repositories/users";
import { getTestDatabase } from "@repo/db/test/setup";
import { validSeed } from "@repo/seed-data/valid-seed";
import { describe, expect, it } from "vitest";

function postgresErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

type AuditRow = {
  userId: string | null;
  projectId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: unknown;
};

const auditUserId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const auditTokenId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

async function seedAuditScope() {
  const database = getTestDatabase();
  await insertUser(database, {
    id: auditUserId,
    email: "audit@example.test",
    passwordHash: "test-hash",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  await insertProject(database, validSeed.projects[0]!);
}

async function insertAuditRow(row: AuditRow) {
  return getTestDatabase().query(
    `INSERT INTO audit_events
      (id, user_id, project_id, action, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      crypto.randomUUID(),
      row.userId,
      row.projectId,
      row.action,
      row.resourceType,
      row.resourceId,
      row.metadata === null ? null : JSON.stringify(row.metadata),
    ],
  );
}

describe("database constraints", () => {
  it("rejects a release for a missing project", async () => {
    const release = {
      ...validSeed.releases[0]!,
      projectId: crypto.randomUUID(),
    };

    await expect(insertRelease(getTestDatabase(), release)).rejects.toSatisfy(
      (error: unknown) => postgresErrorCode(error) === "23503",
    );
  });

  it("rejects duplicate project slugs", async () => {
    const database = getTestDatabase();
    const project = validSeed.projects[0]!;

    await insertProject(database, project);

    await expect(
      insertProject(database, {
        ...project,
        id: crypto.randomUUID(),
        name: "Another Project",
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23505");
  });

  it("rejects duplicate release versions in the same project", async () => {
    const database = getTestDatabase();
    const project = validSeed.projects[0]!;
    const release = validSeed.releases[0]!;

    await insertProject(database, project);
    await insertRelease(database, release);

    await expect(
      insertRelease(database, {
        ...release,
        id: crypto.randomUUID(),
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23505");
  });

  it("rejects invalid release status", async () => {
    const database = getTestDatabase();

    await insertProject(database, validSeed.projects[0]!);

    await expect(
      insertRelease(database, {
        ...validSeed.releases[0]!,
        status: "archived" as never,
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23514");
  });

  it("rejects a token whose token type belongs to another project", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    const otherProject = {
      id: crypto.randomUUID(),
      name: "Other Project",
      slug: "other-project",
      createdAt: "2026-10-27T10:00:00.000Z",
    };

    await insertProject(database, seed.projects[0]!);
    await insertProject(database, otherProject);

    await insertTokenType(database, seed.tokenTypes[0]!);

    await expect(
      insertToken(database, {
        ...seed.tokens[0]!,
        projectId: otherProject.id,
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        postgresErrorCode(error) === "23503" &&
        (error as { constraint?: string }).constraint ===
          "tokens_token_type_same_project_fk",
    );
  });

  it("rejects a self-reference", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    await insertProject(database, seed.projects[0]!);
    await insertTokenType(database, seed.tokenTypes[0]!);
    await insertToken(database, seed.tokens[0]!);

    await expect(
      insertTokenReference(database, {
        projectId: seed.projects[0]!.id,
        referencingTokenId: seed.tokens[0]!.id,
        referencedTokenId: seed.tokens[0]!.id,
        slot: "light",
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23514");
  });

  it("rejects a cross-project reference", async () => {
    const database = getTestDatabase();
    const seed = structuredClone(validSeed);

    const otherProject = {
      id: crypto.randomUUID(),
      name: "Other Project",
      slug: "other-project",
      createdAt: "2026-10-27T10:00:00.000Z",
    };

    await insertProject(database, seed.projects[0]!);
    await insertProject(database, otherProject);

    await insertTokenType(database, seed.tokenTypes[0]!);

    const otherTokenType = await insertTokenType(database, {
      ...seed.tokenTypes[0]!,
      id: crypto.randomUUID(),
      projectId: otherProject.id,
    });

    await insertToken(database, seed.tokens[0]!);

    const otherToken = await insertToken(database, {
      ...seed.tokens[0]!,
      id: crypto.randomUUID(),
      projectId: otherProject.id,
      tokenTypeId: otherTokenType.id,
    });

    await expect(
      insertTokenReference(database, {
        projectId: seed.projects[0]!.id,
        referencingTokenId: seed.tokens[0]!.id,
        referencedTokenId: otherToken.id,
        slot: "dark",
      }),
    ).rejects.toSatisfy((error: unknown) => postgresErrorCode(error) === "23503");
  });

  it("accepts every audit event scope, including an unknown login actor", async () => {
    await seedAuditScope();
    const projectId = validSeed.projects[0]!.id;
    const account = {
      userId: auditUserId,
      projectId: null,
      action: "login.succeeded",
      resourceType: "account",
      resourceId: null,
      metadata: null,
    };
    const rows: AuditRow[] = [
      account,
      { ...account, action: "logout" },
      { ...account, action: "login.failed", userId: null },
      { ...account, action: "login.failed", userId: null, resourceId: auditUserId },
      {
        ...account,
        action: "token.batch_saved",
        projectId,
        resourceType: "token_batch",
        metadata: { tokenIds: [auditTokenId] },
      },
      {
        ...account,
        action: "release.published",
        projectId,
        resourceType: "release",
        resourceId: crypto.randomUUID(),
      },
      ...["api_key.created", "api_key.revoked"].map((action) => ({
        ...account,
        action,
        projectId,
        resourceType: "api_key",
        resourceId: crypto.randomUUID(),
      })),
    ];
    for (const row of rows) await expect(insertAuditRow(row)).resolves.toBeDefined();
  });

  it("rejects invalid actors, scopes, targets, actions, and non-batch metadata", async () => {
    await seedAuditScope();
    const projectId = validSeed.projects[0]!.id;
    const account: AuditRow = {
      userId: auditUserId,
      projectId: null,
      action: "login.succeeded",
      resourceType: "account",
      resourceId: null,
      metadata: null,
    };
    const batch: AuditRow = {
      ...account,
      action: "token.batch_saved",
      projectId,
      resourceType: "token_batch",
      metadata: { tokenIds: [auditTokenId] },
    };
    const invalid: AuditRow[] = [
      { ...account, userId: null },
      { ...account, action: "logout", userId: null },
      { ...account, action: "login.failed" },
      { ...account, action: "login.failed", userId: null, projectId },
      { ...account, resourceId: auditUserId },
      { ...account, metadata: { password: "secret" } },
      { ...account, action: "unknown" },
      { ...batch, userId: null },
      { ...batch, projectId: null },
      { ...batch, resourceId: auditTokenId },
      { ...batch, resourceType: "token" },
      { ...batch, metadata: null },
      { ...account, action: "release.published", projectId, resourceType: "release" },
      { ...account, action: "api_key.created", resourceType: "api_key", resourceId: auditTokenId },
    ];
    for (const row of invalid) {
      await expect(insertAuditRow(row)).rejects.toSatisfy(
        (error: unknown) => postgresErrorCode(error) === "23514",
      );
    }
  });

});
