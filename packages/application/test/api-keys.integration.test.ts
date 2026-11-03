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

  it("creates an API key audit event", async () => {
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
        action: "api_key.created",
        resource_type: "api_key",
        resource_id: created.apiKey.id,
      },
    ]);
  });

  it("rolls back API-key creation when audit insertion fails", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "admin");

    await database.query(`
    CREATE FUNCTION fail_api_key_audit_insert()
    RETURNS trigger AS $$
    BEGIN
      IF NEW.action = 'api_key.created' THEN
        RAISE EXCEPTION 'forced API-key audit failure';
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

    await database.query(`
    CREATE TRIGGER fail_api_key_audit
    BEFORE INSERT ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION fail_api_key_audit_insert()
  `);

    try {
      await expect(
        createApiKey(database, fixture.context, {
          projectId: fixture.project.id,
          expiresAt: "2027-01-01T00:00:00.000Z",
          scope: "release:read",
        }),
      ).rejects.toThrow("forced API-key audit failure");

      const result = await database.query(
        `
        SELECT COUNT(*)::int AS count
        FROM api_keys
        WHERE project_id = $1
      `,
        [fixture.project.id],
      );

      expect(result.rows[0].count).toBe(0);
    } finally {
      await database.query("DROP TRIGGER IF EXISTS fail_api_key_audit ON audit_events");
      await database.query("DROP FUNCTION IF EXISTS fail_api_key_audit_insert()");
    }
  });

  it("Rejects a publisher from creates an API key", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "publisher");

    await expect(
      createApiKey(database, fixture.context, {
        projectId: fixture.project.id,
        expiresAt: "2027-01-01T00:00:00.000Z",
        scope: "release:read",
      }),
    ).rejects.toMatchObject({
      code: "project-access-denied",
    });
  });

  it("Rejects cross-project API-key revocation", async () => {
    const database = getTestDatabase();

    const owner = await seedProject(database, "admin");
    const otherProject = await seedProject(database, "admin");

    const created = await createApiKey(database, owner.context, {
      projectId: owner.project.id,
      expiresAt: "2027-01-01T00:00:00.000Z",
      scope: "release:read",
    });

    await expect(
      revokeApiKey(database, otherProject.context, {
        projectId: otherProject.project.id,
        apiKeyId: created.apiKey.id,
      }),
    ).rejects.toMatchObject({
      code: "resource-not-found",
    });

    const result = await database.query(
      `
      SELECT revoked_at
      FROM api_keys
      WHERE id = $1
    `,
      [created.apiKey.id],
    );

    expect(result.rows[0].revoked_at).toBeNull();
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

    await revokeApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      apiKeyId: created.apiKey.id,
    });

    const result = await database.query(
      `
      SELECT action, resource_type, resource_id
      FROM audit_events
      WHERE project_id = $1
        AND resource_id = $2
        AND action = 'api_key.revoked'
      `,
      [fixture.project.id, created.apiKey.id],
    );

    expect(result.rows).toEqual([
      {
        action: "api_key.revoked",
        resource_id: created.apiKey.id,
        resource_type: "api_key",
      },
    ]);
  });

  it("Rejects a publisher from revokess an API key", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "admin");

    const created = await createApiKey(database, fixture.context, {
      projectId: fixture.project.id,
      expiresAt: "2027-01-01T00:00:00.000Z",
      scope: "release:read",
    });

    await insertProjectMember(database, {
      projectId: fixture.project.id,
      userId: fixture.user.id,
      role: "publisher",
      createdAt: new Date().toISOString(),
    });

    await expect(
      revokeApiKey(database, fixture.context, {
        projectId: fixture.project.id,
        apiKeyId: created.apiKey.id,
      }),
    ).rejects.toMatchObject({
      code: "project-access-denied",
    });
  });
});
