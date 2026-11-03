import { seedProject } from "@repo/application/fixtures";
import { getPublishedRelease } from "@repo/application/services/published-releases";
import { publishRelease } from "@repo/application/services/releases";
import { findReleaseById, insertRelease } from "@repo/db/repositories/releases";
import { getTestDatabase } from "@repo/db/test/setup";
import { describe, expect, it } from "vitest";

describe("Publising release service integration", () => {
  it("does not download a draft release", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "publisher");

    const draft = {
      id: crypto.randomUUID(),
      projectId: fixture.project.id,
      version: "2.0.0",
      status: "draft" as const,
      createdAt: new Date().toISOString(),
      publishedAt: null,
    };

    await insertRelease(database, draft);

    await expect(
      getPublishedRelease(database, fixture.context, draft.id),
    ).rejects.toMatchObject({
      code: "resource-not-found",
    });
  });

  it("creates a release publication audit event", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "publisher");

    const release = await insertRelease(database, {
      id: crypto.randomUUID(),
      projectId: fixture.project.id,
      version: "1.0.0",
      status: "draft",
      createdAt: new Date().toISOString(),
      publishedAt: null,
    });

    await publishRelease(database, fixture.context, {
      projectId: fixture.project.id,
      releaseId: release.id,
    });

    const result = await database.query(
      `
        SELECT action, resource_type, resource_id
        FROM audit_events
        WHERE project_id = $1
     `,
      [fixture.project.id],
    );

    expect(result.rows).toEqual([
      expect.objectContaining({
        action: "release.published",
        resource_type: "release",
        resource_id: release.id,
      }),
    ]);
  });

  it("rolls back publishing when audit insertion fails", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "publisher");

    const release = await insertRelease(database, {
      id: crypto.randomUUID(),
      projectId: fixture.project.id,
      version: "1.0.0",
      status: "draft",
      createdAt: new Date().toISOString(),
      publishedAt: null,
    });

    await database.query(`
    CREATE FUNCTION fail_release_audit_insert()
    RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'forced audit failure';
    END;
    $$ LANGUAGE plpgsql
  `);

    await database.query(`
    CREATE TRIGGER fail_release_audit
    BEFORE INSERT ON audit_events
    FOR EACH ROW EXECUTE FUNCTION fail_release_audit_insert()
  `);

    try {
      await expect(
        publishRelease(database, fixture.context, {
          projectId: fixture.project.id,
          releaseId: release.id,
        }),
      ).rejects.toThrow("forced audit failure");

      await expect(findReleaseById(database, release.id)).resolves.toMatchObject({
        status: "draft",
        publishedAt: null,
      });
    } finally {
      await database.query("DROP TRIGGER IF EXISTS fail_release_audit ON audit_events");
      await database.query("DROP FUNCTION IF EXISTS fail_release_audit_insert()");
    }
  });

  it("does not expose credential fields in a published release response", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "admin");

    const release = await insertRelease(database, {
      id: crypto.randomUUID(),
      projectId: fixture.project.id,
      version: "1.0.0",
      status: "draft",
      createdAt: new Date().toISOString(),
      publishedAt: null,
    });

    await publishRelease(database, fixture.context, {
      projectId: fixture.project.id,
      releaseId: release.id,
    });

    const response = await getPublishedRelease(database, fixture.context, release.id);

    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("keyHash");
    expect(serialized).not.toContain("secret");
  });
});
