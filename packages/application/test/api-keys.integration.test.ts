import { seedProject } from "@repo/application/fixtures";
import { hashApiKey } from "@repo/application/security/api-keys";
import { createApiKey, revokeApiKey } from "@repo/application/services/api-keys";
import { findActiveApiKeyByIdentifier } from "@repo/db/repositories/api-keys";
import { insertProjectMember } from "@repo/db/repositories/memberships";
import { getTestDatabase } from "@repo/db/test/setup";
import { describe, expect, it } from "vitest";

describe("Create API keys service integration", () => {
  it("returns the secret only during creation", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "admin");

    const response = await createApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      expiresAt: "2027-01-01T00:00:00.000Z",
      scope: "release:read",
    });

    expect(response.secret).toEqual(expect.any(String));

    const stored = await database.query(
      `SELECT key_hash, key_identifier
     FROM api_keys
     WHERE id = $1`,
      [response.apiKey.id],
    );

    expect(stored.rows[0]).not.toHaveProperty("secret");
    expect(stored.rows[0].key_hash).toBeTruthy();
    expect(stored.rows[0].key_hash).not.toBe(response.secret);

    expect(stored.rows[0].key_hash).toBe(hashApiKey(response.secret));
  });

  it("rejects an editor from creating an API key", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "editor");

    await expect(
      createApiKey(database, fixture.context, {
        projectId: fixture.project.id,
        expiresAt: "2027-01-01T00:00:00.000Z",
        scope: "release:read",
      }),
    ).rejects.toMatchObject({ code: "project-access-denied" });
  });
});

describe("Revoke API keys service integration", () => {
  it("allows an admin to revoke an API key", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "admin");

    const created = await createApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      expiresAt: "2027-01-01T00:00:00.000Z",
      scope: "release:read",
    });

    const revoked = await revokeApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      apiKeyId: created.apiKey.id,
    });

    expect(revoked).toMatchObject({
      id: created.apiKey.id,
      projectId: fixture.project.id,
    });

    expect(revoked.revokedAt).not.toBeNull();

    const result = await database.query(
      ` 
        SELECT revoked_at
        FROM api_keys
        WHERE id = $1
       `,
      [created.apiKey.id],
    );

    expect(result.rows[0].revoked_at).not.toBeNull();
  });

  it("rejects an editor from revoking an API key", async () => {
    const database = getTestDatabase();

    const adminFixture = await seedProject(database, "admin");

    const editorFixture = await seedProject(database, "editor");

    await insertProjectMember(database, {
      projectId: adminFixture.project.id,
      userId: editorFixture.user.id,
      role: "editor",
      createdAt: new Date().toISOString(),
    });

    const created = await createApiKey(database, adminFixture.context, {
      projectId: adminFixture.project.id,
      expiresAt: "2027-01-01T00:00:00.000Z",
      scope: "release:read",
    });

    await expect(
      revokeApiKey(database, editorFixture.context, {
        projectId: adminFixture.project.id,
        apiKeyId: created.apiKey.id,
      }),
    ).rejects.toMatchObject({
      code: "project-access-denied",
    });
  });

  it("does not return a revoked key as active", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "admin");

    const created = await createApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      expiresAt: "2027-01-01T00:00:00.000Z",
      scope: "release:read",
    });

    await revokeApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      apiKeyId: created.apiKey.id,
    });

    await expect(
      findActiveApiKeyByIdentifier(database, created.apiKey.keyIdentifier),
    ).resolves.toBeNull();
  });

  it("creates an API keys revoke audit event", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "admin");

    const created = await createApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      expiresAt: "2027-01-01T00:00:00.000Z",
      scope: "release:read",
    });

    const result = await database.query(
      `
        SELECT action, resource_type, resource_id
        FROM audit_events
        WHERE project_id = $1
        AND resource_id = $2
       `,
      [fixture.project.id, created.apiKey.id],
    );

    expect(result.rows).toEqual([
      {
        action: "api_key.revoked",
        resource_type: "api_key",
        resource_id: created.apiKey.id,
      },
    ]);
  });
});
