import { seedProject } from "@repo/application/fixtures";
import { createApiKey, revokeApiKey } from "@repo/application/services/api-keys";
import { downloadReleaseWithApiKey } from "@repo/application/services/download-release";
import { publishStagedChanges } from "@repo/application/services/staged-publishing";
import { insertRelease } from "@repo/db/repositories/releases";
import { getTestDatabase } from "@repo/db/test/setup";
import type { Pool } from "pg";
import { describe, expect, it } from "vitest";

const FUTURE_EXPIRATION = "2099-01-01T00:00:00.000Z";

async function createCredential(
  database: Pool,
  fixture: Awaited<ReturnType<typeof seedProject>>,
) {
  return createApiKey(database, fixture.context, {
    projectId: fixture.project.id,
    expiresAt: FUTURE_EXPIRATION,
    scope: "release:read",
  });
}

async function publishRelease(
  database: Pool,
  fixture: Awaited<ReturnType<typeof seedProject>>,
) {
  return publishStagedChanges(database, fixture.context, {
    projectId: fixture.project.id,
    changes: [
      {
        tokenId: fixture.referencedToken.id,
        name: { before: fixture.referencedToken.name, after: "published" },
        references: [],
      },
    ],
  });
}

describe("downloadReleaseWithApiKey integration", () => {
  it("downloads a published snapshot with an API key credential", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const { release, tokens } = await publishRelease(database, fixture);
    const created = await createCredential(database, fixture);

    const response = await downloadReleaseWithApiKey(
      database,
      created.credential,
      release.id,
    );

    expect(response).toMatchObject({
      schemaVersion: 1,
      release: { id: release.id, projectId: fixture.project.id, status: "published" },
    });
    expect(response.tokens).toEqual(expect.arrayContaining(tokens));

    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain("keyHash");
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("session");
    expect(serialized).not.toContain("secret");
  });

  it("rejects a missing, malformed, or non-matching credential", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const { release } = await publishRelease(database, fixture);
    const created = await createCredential(database, fixture);

    for (const credential of [
      undefined,
      "not-an-api-key",
      `${created.credential.slice(0, -1)}${created.credential.endsWith("A") ? "B" : "A"}`,
    ]) {
      await expect(
        downloadReleaseWithApiKey(database, credential, release.id),
      ).rejects.toMatchObject({ code: "invalid-api-key-credential" });
    }
  });

  it("rejects an expired API key", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const { release } = await publishRelease(database, fixture);
    const created = await createCredential(database, fixture);

    await database.query(
      `
        UPDATE api_keys
        SET created_at = NOW() - INTERVAL '2 days',
            expires_at = NOW() - INTERVAL '1 day'
        WHERE id = $1
      `,
      [created.apiKey.id],
    );

    await expect(
      downloadReleaseWithApiKey(database, created.credential, release.id),
    ).rejects.toMatchObject({ code: "invalid-api-key-credential" });
  });

  it("rejects a revoked API key", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const { release } = await publishRelease(database, fixture);
    const created = await createCredential(database, fixture);

    await revokeApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      apiKeyId: created.apiKey.id,
    });

    await expect(
      downloadReleaseWithApiKey(database, created.credential, release.id),
    ).rejects.toMatchObject({ code: "invalid-api-key-credential" });
  });

  it("rejects an API key without release read scope", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const { release } = await publishRelease(database, fixture);
    const created = await createCredential(database, fixture);

    await database.query("ALTER TABLE api_keys DROP CONSTRAINT api_keys_scope_check");

    try {
      await database.query("UPDATE api_keys SET scope = 'release:write' WHERE id = $1", [
        created.apiKey.id,
      ]);

      await expect(
        downloadReleaseWithApiKey(database, created.credential, release.id),
      ).rejects.toMatchObject({ code: "api-key-scope-denied" });
    } finally {
      await database.query("UPDATE api_keys SET scope = 'release:read' WHERE id = $1", [
        created.apiKey.id,
      ]);
      await database.query(
        "ALTER TABLE api_keys ADD CONSTRAINT api_keys_scope_check CHECK (scope IN ('release:read'))",
      );
    }
  });

  it("hides a release belonging to another project", async () => {
    const database = getTestDatabase();
    const owner = await seedProject(database, "admin");
    const otherProject = await seedProject(database, "admin");
    const { release } = await publishRelease(database, owner);
    const created = await createCredential(database, otherProject);

    await expect(
      downloadReleaseWithApiKey(database, created.credential, release.id),
    ).rejects.toMatchObject({ code: "resource-not-found" });
  });

  it("hides a release that does not exist", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const created = await createCredential(database, fixture);

    await expect(
      downloadReleaseWithApiKey(database, created.credential, crypto.randomUUID()),
    ).rejects.toMatchObject({ code: "resource-not-found" });
  });

  it("hides an unpublished release", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const created = await createCredential(database, fixture);
    const draft = await insertRelease(database, {
      id: crypto.randomUUID(),
      projectId: fixture.project.id,
      version: "1",
      status: "draft",
      createdAt: new Date().toISOString(),
      publishedAt: null,
    });

    await expect(
      downloadReleaseWithApiKey(database, created.credential, draft.id),
    ).rejects.toMatchObject({ code: "resource-not-found" });
  });

  it("fails safely when a published snapshot is missing", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");
    const { release } = await publishRelease(database, fixture);
    const created = await createCredential(database, fixture);

    await database.query("DELETE FROM release_snapshots WHERE release_id = $1", [
      release.id,
    ]);

    await expect(
      downloadReleaseWithApiKey(database, created.credential, release.id),
    ).rejects.toMatchObject({ code: "resource-not-found" });
  });
});
