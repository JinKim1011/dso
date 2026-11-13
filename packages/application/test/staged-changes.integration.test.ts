import {
  ProjectAccessDeniedError,
  StagedChangesConflictError,
  StagedChangesValidationError,
} from "@repo/application/errors";
import { seedProject } from "@repo/application/fixtures";
import { withProjectTransaction } from "@repo/application/services/project-transaction";
import { saveStagedChanges } from "@repo/application/services/staged-changes";
import { addTokenReference } from "@repo/application/services/token-references";
import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import {
  insertTokenReference,
  listTokenReferencesByProjectId,
} from "@repo/db/repositories/references";
import { insertToken, listTokensByProjectId } from "@repo/db/repositories/tokens";
import { getTestDatabase } from "@repo/db/test/setup";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";

describe("staged changes service", () => {
  it("uses READ COMMITTED even when the connection defaults to SERIALIZABLE", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      options: "-c default_transaction_isolation=serializable",
    });
    try {
      const defaultIsolation = await pool.query<{
        default_transaction_isolation: string;
      }>("SHOW default_transaction_isolation");
      expect(defaultIsolation.rows[0]?.default_transaction_isolation).toBe(
        "serializable",
      );
      const isolation = await withProjectTransaction(
        pool,
        fixture.project.id,
        async (client) => {
          const result = await client.query<{ transaction_isolation: string }>(
            "SHOW transaction_isolation",
          );
          return result.rows[0]?.transaction_isolation;
        },
      );
      expect(isolation).toBe("read committed");
    } finally {
      await pool.end();
    }
  });

  it("saves token changes and reference assignments together and returns persisted rows", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const primitive = fixture.referencedToken;
    const semantic = fixture.referencingToken;
    const request: SaveStagedChangesRequest = {
      projectId: fixture.project.id.toUpperCase(),
      changes: [
        {
          tokenId: primitive.id.toUpperCase(),
          name: { before: primitive.name, after: "updated" },
          value: { before: primitive.value, after: { kind: "single", value: "#123" } },
          references: [],
        },
        {
          tokenId: semantic.id,
          references: [
            {
              slot: "light",
              beforeTokenId: null,
              afterTokenId: primitive.id.toUpperCase(),
            },
            { slot: "dark", beforeTokenId: null, afterTokenId: primitive.id },
          ],
        },
      ],
    };

    const result = await saveStagedChanges(database, fixture.context, request);
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens).toContainEqual({
      ...primitive,
      name: "updated",
      value: { kind: "single", value: "#123" },
    });
    expect(result.tokens).toContainEqual(semantic);
    expect(result.references).toHaveLength(2);
    expect(result.references).toEqual(
      expect.arrayContaining([
        {
          projectId: fixture.project.id,
          referencingTokenId: semantic.id,
          referencedTokenId: primitive.id,
          slot: "light",
        },
        {
          projectId: fixture.project.id,
          referencingTokenId: semantic.id,
          referencedTokenId: primitive.id,
          slot: "dark",
        },
      ]),
    );
    expect(await listTokenReferencesByProjectId(database, fixture.project.id)).toEqual(
      result.references,
    );
  });

  it("replaces and clears selected slots while returning unchanged slots", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const target = fixture.referencedToken;
    const replacement = { ...target, id: crypto.randomUUID(), name: "replacement" };
    await insertToken(database, replacement);
    for (const slot of ["light", "dark"] as const) {
      await addTokenReference(database, fixture.context, {
        projectId: fixture.project.id,
        referencingTokenId: fixture.referencingToken.id,
        referencedTokenId: target.id,
        slot,
      });
    }

    const replaceResult = await saveStagedChanges(database, fixture.context, {
      projectId: fixture.project.id,
      changes: [
        {
          tokenId: fixture.referencingToken.id,
          references: [
            { slot: "light", beforeTokenId: target.id, afterTokenId: replacement.id },
          ],
        },
      ],
    });
    expect(replaceResult.references).toHaveLength(2);
    expect(replaceResult.references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slot: "light", referencedTokenId: replacement.id }),
        expect.objectContaining({ slot: "dark", referencedTokenId: target.id }),
      ]),
    );

    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencingToken.id,
            references: [
              { slot: "light", beforeTokenId: target.id, afterTokenId: target.id },
            ],
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: "staged-changes-conflict",
      issues: expect.arrayContaining([
        expect.objectContaining({
          tokenId: fixture.referencingToken.id,
          field: "references.light",
        }),
      ]),
    });

    const clearResult = await saveStagedChanges(database, fixture.context, {
      projectId: fixture.project.id,
      changes: [
        {
          tokenId: fixture.referencingToken.id,
          references: [
            { slot: "light", beforeTokenId: replacement.id, afterTokenId: null },
          ],
        },
      ],
    });
    expect(clearResult.references).toEqual([
      expect.objectContaining({ slot: "dark", referencedTokenId: target.id }),
    ]);
  });

  it("rejects stale before values and leaves every requested token untouched", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencedToken.id,
            name: { before: fixture.referencedToken.name, after: "not-saved" },
            references: [],
          },
          {
            tokenId: fixture.referencingToken.id,
            name: { before: "stale", after: "also-not-saved" },
            references: [],
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: "staged-changes-conflict",
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "conflict",
          tokenId: fixture.referencingToken.id,
          field: "name",
        }),
      ]),
    });
    expect(await listTokensByProjectId(database, fixture.project.id)).toEqual(
      expect.arrayContaining([fixture.referencedToken, fixture.referencingToken]),
    );
  });

  it("rejects invalid final state, including unchanged primitive values", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencedToken.id,
            value: {
              before: fixture.referencedToken.value,
              after: { kind: "single", value: "var(--missing)" },
            },
            references: [],
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: "domain-validation",
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-value",
          tokenId: fixture.referencedToken.id,
        }),
      ]),
    });

    await database.query("UPDATE tokens SET value = $1 WHERE id = $2", [
      JSON.stringify({ kind: "single", value: "var(--old)" }),
      fixture.referencedToken.id,
    ]);
    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencingToken.id,
            name: { before: fixture.referencingToken.name, after: "not-saved" },
            references: [],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(StagedChangesValidationError);
    expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual(
      fixture.referencingToken,
    );
    const repaired = await saveStagedChanges(database, fixture.context, {
      projectId: fixture.project.id,
      changes: [
        {
          tokenId: fixture.referencedToken.id,
          value: {
            before: { kind: "single", value: "var(--old)" },
            after: fixture.referencedToken.value,
          },
          references: [],
        },
        {
          tokenId: fixture.referencingToken.id,
          name: { before: fixture.referencingToken.name, after: "saved-together" },
          references: [],
        },
      ],
    });
    expect(repaired.tokens).toContainEqual({
      ...fixture.referencingToken,
      name: "saved-together",
    });
  });

  it("rejects unrelated invalid references but allows a batch to repair them", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const invalidReference = {
      projectId: fixture.project.id,
      referencingTokenId: fixture.referencingToken.id,
      referencedTokenId: fixture.referencedToken.id,
      slot: "fontSize" as const,
    };
    await insertTokenReference(database, invalidReference);
    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencedToken.id,
            name: { before: fixture.referencedToken.name, after: "new-name" },
            references: [],
          },
        ],
      }),
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({
          tokenId: fixture.referencingToken.id,
          referencedTokenId: fixture.referencedToken.id,
          field: "references.fontSize",
        }),
      ]),
    });
    const repaired = await saveStagedChanges(database, fixture.context, {
      projectId: fixture.project.id,
      changes: [
        {
          tokenId: fixture.referencingToken.id,
          references: [
            {
              slot: "fontSize",
              beforeTokenId: fixture.referencedToken.id,
              afterTokenId: null,
            },
          ],
        },
      ],
    });
    expect(repaired.references).toEqual([]);
    expect(await listTokenReferencesByProjectId(database, fixture.project.id)).toEqual(
      [],
    );
  });

  it("rejects cross-project tokens and targets without changing either project", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const other = await seedProject(database, "editor");
    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: other.referencedToken.id,
            name: { before: other.referencedToken.name, after: "not-saved" },
            references: [],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(StagedChangesValidationError);
    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencingToken.id,
            references: [
              {
                slot: "light",
                beforeTokenId: null,
                afterTokenId: other.referencedToken.id,
              },
            ],
          },
        ],
      }),
    ).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "missing-referenced-token" }),
      ]),
    });
    expect(await listTokensByProjectId(database, other.project.id)).toContainEqual(
      other.referencedToken,
    );
    expect(await listTokenReferencesByProjectId(database, fixture.project.id)).toEqual(
      [],
    );
  });

  it("requires project membership", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const other = await seedProject(database, "editor");
    await expect(
      saveStagedChanges(database, other.context, {
        projectId: fixture.project.id,
        changes: [],
      }),
    ).rejects.toBeInstanceOf(ProjectAccessDeniedError);
  });

  it("accepts empty batches and no-ops but still checks before values", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    expect(
      await saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [],
      }),
    ).toEqual({ tokens: [], references: [] });
    const token = fixture.referencingToken;
    expect(
      await saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: token.id,
            name: { before: token.name, after: token.name },
            references: [{ slot: "light", beforeTokenId: null, afterTokenId: null }],
          },
        ],
      }),
    ).toEqual({ tokens: [token], references: [] });
    await expect(
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: token.id,
            name: { before: "stale", after: "stale" },
            references: [],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(StagedChangesConflictError);
  });

  it("rolls back earlier writes if a later database write fails", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    await database.query(
      "ALTER TABLE tokens ADD CONSTRAINT staged_test_name_check CHECK (name <> 'force-failure')",
    );
    try {
      await expect(
        saveStagedChanges(database, fixture.context, {
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: fixture.referencedToken.id,
              name: { before: fixture.referencedToken.name, after: "first-write" },
              references: [],
            },
            {
              tokenId: fixture.referencingToken.id,
              name: { before: fixture.referencingToken.name, after: "force-failure" },
              references: [],
            },
          ],
        }),
      ).rejects.toMatchObject({ code: "23514" });
      expect(await listTokensByProjectId(database, fixture.project.id)).toEqual(
        expect.arrayContaining([fixture.referencedToken, fixture.referencingToken]),
      );
    } finally {
      await database.query("ALTER TABLE tokens DROP CONSTRAINT staged_test_name_check");
    }
  });

  it("serializes competing saves and rejects the stale request", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const token = fixture.referencedToken;
    const save = (after: string) =>
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          { tokenId: token.id, name: { before: token.name, after }, references: [] },
        ],
      });
    const results = await Promise.allSettled([save("first"), save("second")]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      status: "rejected",
      reason: expect.any(StagedChangesConflictError),
    });
  });

  it("allows concurrent changes to different fields after revalidating", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const token = fixture.referencedToken;
    await Promise.all([
      saveStagedChanges(database, fixture.context, {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: token.id,
            name: { before: token.name, after: "renamed" },
            references: [],
          },
        ],
      }),
      saveStagedChanges(database, fixture.context, {
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
    expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual({
      ...token,
      name: "renamed",
      value: { kind: "single", value: "#123" },
    });
  });

  it("uses the same project lock as the existing reference writer", async () => {
    const database = getTestDatabase();
    const fixture = await seedProject(database, "editor");
    const blocker = await database.connect();
    let results: Promise<PromiseSettledResult<unknown>[]> | undefined;
    try {
      await blocker.query("BEGIN");
      await blocker.query("SELECT id FROM projects WHERE id = $1 FOR UPDATE", [
        fixture.project.id,
      ]);
      const reference = {
        projectId: fixture.project.id,
        referencingTokenId: fixture.referencingToken.id,
        referencedTokenId: fixture.referencedToken.id,
        slot: "light" as const,
      };
      results = Promise.allSettled([
        addTokenReference(database, fixture.context, reference),
        saveStagedChanges(database, fixture.context, {
          projectId: fixture.project.id,
          changes: [
            {
              tokenId: reference.referencingTokenId,
              references: [
                {
                  slot: "light",
                  beforeTokenId: null,
                  afterTokenId: reference.referencedTokenId,
                },
              ],
            },
          ],
        }),
      ]);

      let blocked = 0;
      const deadline = Date.now() + 5000;
      while (blocked < 2 && Date.now() < deadline) {
        const status = await database.query<{ count: number }>(
          `SELECT count(*)::int AS count FROM pg_stat_activity
           WHERE wait_event_type = 'Lock'
             AND query LIKE '%FROM projects%'
             AND query LIKE '%FOR UPDATE%'`,
        );
        blocked = status.rows[0]!.count;
        if (blocked < 2) await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(blocked).toBe(2);
    } finally {
      await blocker.query("ROLLBACK");
      blocker.release();
    }
    const settled = await results;
    expect(settled?.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(settled?.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(
      await listTokenReferencesByProjectId(database, fixture.project.id),
    ).toHaveLength(1);
  });
});
