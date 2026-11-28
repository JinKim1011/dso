import { seedProject } from "@repo/application/fixtures";
import { getPublishedReleaseForSession } from "@repo/application/services/published-releases";
import { publishStagedChanges } from "@repo/application/services/staged-publishing";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { insertRelease } from "@repo/db/repositories/releases";
import { insertComponent } from "@repo/db/repositories/components";
import { insertDocumentTemplate } from "@repo/db/repositories/templates";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";
import { getTestDatabase } from "@repo/db/test/setup";
import { MAX_RELEASE_RESPONSE_BYTES } from "@repo/release-protocol/limits";
import { describe, expect, it } from "vitest";

describe("Publising release service integration", () => {
  it("does not download a draft release", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "publisher");

    const draft = {
      id: crypto.randomUUID(),
      projectId: fixture.project.id,
      version: "2",
      status: "draft" as const,
      createdAt: new Date().toISOString(),
      publishedAt: null,
    };

    await insertRelease(database, draft);

    await expect(
      getPublishedReleaseForSession(database, fixture.context, draft.id),
    ).rejects.toMatchObject({
      code: "resource-not-found",
    });
  });

  describe("staged publishing service integration", () => {
    it("returns the original result when the same publish request is retried", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const primitive = fixture.referencedToken;
      const requestId = crypto.randomUUID();
      const request = {
        requestId,
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: primitive.id,
            name: { before: primitive.name, after: "idempotent-name" },
            references: [],
          },
        ],
      };

      const first = await publishStagedChanges(database, fixture.context, request);
      const retried = await publishStagedChanges(database, fixture.context, request);

      expect(retried).toEqual(first);
      expect(
        (await database.query("SELECT release_id FROM publish_requests")).rows,
      ).toEqual([{ release_id: first.release.id }]);
      expect((await database.query("SELECT id FROM releases")).rows).toHaveLength(1);
    });

    it("rejects reuse of a publish request ID for different changes", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const primitive = fixture.referencedToken;
      const requestId = crypto.randomUUID();

      await publishStagedChanges(database, fixture.context, {
        requestId,
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: primitive.id,
            name: { before: primitive.name, after: "first-name" },
            references: [],
          },
        ],
      });

      await expect(
        publishStagedChanges(database, fixture.context, {
          requestId,
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: primitive.id,
              name: { before: "first-name", after: "different-name" },
              references: [],
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "publish-request-conflict" });
    });

    it("rejects a corrupted stored publication response", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const primitive = fixture.referencedToken;
      const request = {
        requestId: crypto.randomUUID(),
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: primitive.id,
            name: { before: primitive.name, after: "stored-response-name" },
            references: [],
          },
        ],
      };

      await publishStagedChanges(database, fixture.context, request);
      await database.query(
        `UPDATE publish_requests
         SET response_data = jsonb_set(response_data, '{release,id}', to_jsonb($1::text))
         WHERE request_id = $2`,
        [crypto.randomUUID(), request.requestId],
      );

      await expect(
        publishStagedChanges(database, fixture.context, request),
      ).rejects.toThrow("Stored publish response is invalid.");
    });

    it("serializes concurrent retries of the same publish request", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const primitive = fixture.referencedToken;
      const request = {
        requestId: crypto.randomUUID(),
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: primitive.id,
            name: { before: primitive.name, after: "concurrent-name" },
            references: [],
          },
        ],
      };

      const [first, second] = await Promise.all([
        publishStagedChanges(database, fixture.context, request),
        publishStagedChanges(database, fixture.context, request),
      ]);

      expect(second).toEqual(first);
      expect((await database.query("SELECT id FROM releases")).rows).toHaveLength(1);
      expect(
        (await database.query("SELECT request_id FROM publish_requests")).rows,
      ).toHaveLength(1);
    });

    it("saves changes, publishes their snapshot, and records both audit events", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const primitive = fixture.referencedToken;
      const semantic = fixture.referencingToken;

      const result = await publishStagedChanges(database, fixture.context, {
        requestId: crypto.randomUUID(),
        projectId: fixture.project.id.toUpperCase(),
        changes: [
          {
            tokenId: primitive.id,
            name: { before: primitive.name, after: "published-name" },
            references: [],
          },
          {
            tokenId: semantic.id,
            references: [
              { slot: "light", beforeTokenId: null, afterTokenId: primitive.id },
            ],
          },
        ],
      });

      expect(result.release).toMatchObject({
        projectId: fixture.project.id,
        version: "1",
        status: "published",
        publishedAt: expect.any(String),
      });
      expect(result.tokens).toContainEqual({ ...primitive, name: "published-name" });
      expect(result.references).toEqual([
        {
          projectId: fixture.project.id,
          referencingTokenId: semantic.id,
          referencedTokenId: primitive.id,
          slot: "light",
        },
      ]);
      const snapshot = await getPublishedReleaseForSession(
        database,
        fixture.context,
        result.release.id,
      );
      expect(snapshot.tokens).toContainEqual({ ...primitive, name: "published-name" });
      expect(snapshot.references).toEqual(result.references);

      const audit = await database.query(
        `SELECT user_id, action, resource_type, resource_id, metadata
           FROM audit_events WHERE project_id = $1 ORDER BY action`,
        [fixture.project.id],
      );
      expect(audit.rows).toEqual([
        {
          user_id: fixture.user.id,
          action: "release.published",
          resource_type: "release",
          resource_id: result.release.id,
          metadata: null,
        },
        {
          user_id: fixture.user.id,
          action: "token.batch_saved",
          resource_type: "token_batch",
          resource_id: null,
          metadata: { tokenIds: expect.arrayContaining([primitive.id, semantic.id]) },
        },
      ]);
      expect(audit.rows[1].metadata.tokenIds).toHaveLength(2);
    });

    it("serializes concurrent publishes and gives each a consistent numbered snapshot", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const token = fixture.referencedToken;
      const results = await Promise.all([
        publishStagedChanges(database, fixture.context, {
          requestId: crypto.randomUUID(),
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: token.id,
              name: { before: token.name, after: "renamed" },
              references: [],
            },
          ],
        }),
        publishStagedChanges(database, fixture.context, {
          requestId: crypto.randomUUID(),
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: token.id,
              value: { before: token.value, after: { kind: "single", value: "#123" } },
              references: [],
            },
          ],
        }),
      ]);
      const first = results.find((result) => result.release.version === "1");
      const second = results.find((result) => result.release.version === "2");
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      const firstSnapshot = await getPublishedReleaseForSession(
        database,
        fixture.context,
        first!.release.id,
      );
      const secondSnapshot = await getPublishedReleaseForSession(
        database,
        fixture.context,
        second!.release.id,
      );
      expect(firstSnapshot.tokens).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: token.id })]),
      );
      const firstToken = firstSnapshot.tokens.find((item) => item.id === token.id)!;
      expect(
        [
          firstToken.name === "renamed",
          firstToken.value.kind === "single" && firstToken.value.value === "#123",
        ].filter(Boolean),
      ).toHaveLength(1);
      expect(secondSnapshot.tokens).toContainEqual({
        ...token,
        name: "renamed",
        value: { kind: "single", value: "#123" },
      });
    });

    it("rejects empty and no-op batches without creating a release or audit event", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const token = fixture.referencedToken;
      for (const changes of [
        [],
        [
          {
            tokenId: token.id,
            name: { before: token.name, after: token.name },
            references: [],
          },
        ],
      ]) {
        await expect(
          publishStagedChanges(database, fixture.context, {
            requestId: crypto.randomUUID(),
            projectId: fixture.project.id,
            changes,
          }),
        ).rejects.toMatchObject({
          code: "domain-validation",
          issues: [{ code: "no-changes" }],
        });
      }
      expect((await database.query("SELECT id FROM releases")).rows).toEqual([]);
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    });

    it("rejects editors before changing any project data", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "editor");
      const token = fixture.referencedToken;
      await expect(
        publishStagedChanges(database, fixture.context, {
          requestId: crypto.randomUUID(),
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: token.id,
              name: { before: token.name, after: "not-saved" },
              references: [],
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "project-access-denied" });
      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual(
        token,
      );
      expect((await database.query("SELECT id FROM releases")).rows).toEqual([]);
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    });

    it("requires project membership before changing any project data", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const other = await seedProject(database, "publisher");
      await expect(
        publishStagedChanges(database, other.context, {
          requestId: crypto.randomUUID(),
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: fixture.referencedToken.id,
              name: { before: fixture.referencedToken.name, after: "not-saved" },
              references: [],
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "project-access-denied" });
      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual(
        fixture.referencedToken,
      );
      expect((await database.query("SELECT id FROM releases")).rows).toEqual([]);
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    });

    it("rejects stale changes without saving or creating a release", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      await expect(
        publishStagedChanges(database, fixture.context, {
          requestId: crypto.randomUUID(),
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: fixture.referencedToken.id,
              name: { before: "stale", after: "not-saved" },
              references: [],
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "staged-changes-conflict" });
      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual(
        fixture.referencedToken,
      );
      expect((await database.query("SELECT id FROM releases")).rows).toEqual([]);
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    });

    it("rolls back publication when the signed release exceeds the download limit", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      const component = {
        id: crypto.randomUUID(),
        projectId: fixture.project.id,
        name: "Large documentation",
        slug: "large-documentation",
        description: "Individually valid templates with an oversized aggregate.",
        documentPath: "docs/large.md",
      };
      await insertComponent(database, component);
      const templateContent = "x".repeat(100_000);
      const templateCount =
        Math.ceil(MAX_RELEASE_RESPONSE_BYTES / templateContent.length) + 1;

      for (let index = 0; index < templateCount; index += 1) {
        await insertDocumentTemplate(database, {
          id: crypto.randomUUID(),
          projectId: fixture.project.id,
          componentId: component.id,
          name: `Template ${index}`,
          content: templateContent,
        });
      }

      await expect(
        publishStagedChanges(database, fixture.context, {
          requestId: crypto.randomUUID(),
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: fixture.referencedToken.id,
              name: {
                before: fixture.referencedToken.name,
                after: "should-roll-back",
              },
              references: [],
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: "domain-validation",
        issues: [
          {
            code: "release-too-large",
            message: expect.stringContaining("signature metadata"),
          },
        ],
      });

      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual(
        fixture.referencedToken,
      );
      expect((await database.query("SELECT id FROM releases")).rows).toEqual([]);
      expect(
        (await database.query("SELECT release_id FROM release_snapshots")).rows,
      ).toEqual([]);
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    });

    it.each(["token.batch_saved", "release.published"])(
      "rolls back the entire publication if %s audit insertion fails",
      async (action) => {
        const database = getTestDatabase();
        const fixture = await seedProject(database, "publisher");
        await database.query(`
            CREATE FUNCTION fail_staged_publication_audit()
            RETURNS trigger AS $$
            BEGIN
              IF NEW.action = TG_ARGV[0] THEN
                RAISE EXCEPTION 'forced staged publication audit failure';
              END IF;
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
          `);
        await database.query(`
            CREATE TRIGGER fail_staged_publication_audit
            BEFORE INSERT ON audit_events
            FOR EACH ROW EXECUTE FUNCTION fail_staged_publication_audit('${action}')
          `);
        try {
          await expect(
            publishStagedChanges(database, fixture.context, {
              requestId: crypto.randomUUID(),
              projectId: fixture.project.id,
              changes: [
                {
                  tokenId: fixture.referencedToken.id,
                  name: { before: fixture.referencedToken.name, after: "not-saved" },
                  references: [],
                },
                {
                  tokenId: fixture.referencingToken.id,
                  references: [
                    {
                      slot: "light",
                      beforeTokenId: null,
                      afterTokenId: fixture.referencedToken.id,
                    },
                  ],
                },
              ],
            }),
          ).rejects.toThrow("forced staged publication audit failure");
          expect(await listTokensByProjectId(database, fixture.project.id)).toEqual(
            expect.arrayContaining([fixture.referencedToken, fixture.referencingToken]),
          );
          expect(
            await listTokenReferencesByProjectId(database, fixture.project.id),
          ).toEqual([]);
          expect((await database.query("SELECT id FROM releases")).rows).toEqual([]);
          expect(
            (await database.query("SELECT release_id FROM release_snapshots")).rows,
          ).toEqual([]);
          expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
        } finally {
          await database.query(
            "DROP TRIGGER IF EXISTS fail_staged_publication_audit ON audit_events",
          );
          await database.query("DROP FUNCTION IF EXISTS fail_staged_publication_audit()");
        }
      },
    );

    it("uses numeric version order and rejects incompatible existing versions", async () => {
      const database = getTestDatabase();
      const fixture = await seedProject(database, "publisher");
      for (const version of ["9", "10"]) {
        await insertRelease(database, {
          id: crypto.randomUUID(),
          projectId: fixture.project.id,
          version,
          status: "published",
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
        });
      }
      const token = fixture.referencedToken;
      const result = await publishStagedChanges(database, fixture.context, {
        requestId: crypto.randomUUID(),
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: token.id,
            name: { before: token.name, after: "published" },
            references: [],
          },
        ],
      });
      expect(result.release.version).toBe("11");

      await insertRelease(database, {
        id: crypto.randomUUID(),
        projectId: fixture.project.id,
        version: "1.0.0",
        status: "draft",
        createdAt: new Date().toISOString(),
        publishedAt: null,
      });
      await expect(
        publishStagedChanges(database, fixture.context, {
          requestId: crypto.randomUUID(),
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: token.id,
              name: { before: "published", after: "not-saved" },
              references: [],
            },
          ],
        }),
      ).rejects.toThrow("Cannot determine the next release version.");
      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual({
        ...token,
        name: "published",
      });
      const events = await database.query("SELECT action FROM audit_events");
      expect(events.rows).toHaveLength(2);
    });
  });

  it("does not expose credential fields in a published release response", async () => {
    const database = getTestDatabase();

    const fixture = await seedProject(database, "admin");

    const { release } = await publishStagedChanges(database, fixture.context, {
      requestId: crypto.randomUUID(),
      projectId: fixture.project.id,
      changes: [
        {
          tokenId: fixture.referencedToken.id,
          name: { before: fixture.referencedToken.name, after: "published" },
          references: [],
        },
      ],
    });

    const response = await getPublishedReleaseForSession(
      database,
      fixture.context,
      release.id,
    );

    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("keyHash");
    expect(serialized).not.toContain("secret");
  });

  it("returns the published snapshot instead of current project contents", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "publisher");

    const { release } = await publishStagedChanges(database, fixture.context, {
      requestId: crypto.randomUUID(),
      projectId: fixture.project.id,
      changes: [
        {
          tokenId: fixture.referencedToken.id,
          name: { before: fixture.referencedToken.name, after: "published" },
          references: [],
        },
      ],
    });

    const beforeChanges = await getPublishedReleaseForSession(
      database,
      fixture.context,
      release.id,
    );

    await database.query(
      `
      UPDATE token_types
      SET parent_type_id = NULL
      WHERE project_id = $1
    `,
      [fixture.project.id],
    );

    const afterChanges = await getPublishedReleaseForSession(
      database,
      fixture.context,
      release.id,
    );

    expect(afterChanges.tokenTypes).toEqual(beforeChanges.tokenTypes);
    expect(afterChanges.tokens).toEqual(beforeChanges.tokens);
    expect(afterChanges.references).toEqual(beforeChanges.references);
    expect(afterChanges.components).toEqual(beforeChanges.components);
    expect(afterChanges.templates).toEqual(beforeChanges.templates);
  });
});
