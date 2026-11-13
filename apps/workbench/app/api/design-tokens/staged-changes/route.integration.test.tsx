import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import {
  StagedManifestProvider,
  useStagedContext,
} from "@/features/tokens/state/staged-context";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import { getDatabasePool } from "@/server/database";
import { seedProject } from "@repo/application/fixtures";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { insertSession } from "@repo/db/repositories/sessions";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";
import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { POST } from "./route";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));

const origin = "http://localhost:3000";
let database: Awaited<ReturnType<typeof setupDatabase>>;

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "staged changes HTTP and PostgreSQL integration",
  () => {
    beforeAll(async () => {
      database = await setupDatabase();
    });

    beforeEach(async () => {
      await resetDatabase(database);
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
      vi.stubEnv("SESSION_COOKIE_NAME", "dso_session");
      vi.mocked(getDatabasePool).mockReturnValue(database);
    });

    afterEach(() => {
      localStorage.clear();
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
      vi.resetAllMocks();
    });

    afterAll(async () => {
      await closeDatabase();
    });

    async function createSession(userId: string): Promise<string> {
      const id = crypto.randomUUID();
      const now = Date.now();
      await insertSession(database, {
        id,
        userId,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
      });
      return id;
    }

    function request(body: unknown, sessionId: string): Request {
      return new Request(`${origin}/api/design-tokens/staged-changes`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/json",
          cookie: `dso_session=${sessionId}`,
        },
        body: JSON.stringify(body),
      });
    }

    it("saves via a real session, parser, service and database, then rejects stale data", async () => {
      const fixture = await seedProject(database, "editor");
      const sessionId = await createSession(fixture.user.id);
      const payload = {
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencedToken.id,
            name: { before: fixture.referencedToken.name, after: "saved" },
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
      };

      const response = await POST(request(payload, sessionId));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        ok: true,
        tokens: expect.arrayContaining([expect.objectContaining({ name: "saved" })]),
        references: [expect.objectContaining({ slot: "light" })],
      });
      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual({
        ...fixture.referencedToken,
        name: "saved",
      });
      expect(
        await listTokenReferencesByProjectId(database, fixture.project.id),
      ).toHaveLength(1);

      const stale = await POST(request(payload, sessionId));
      expect(stale.status).toBe(409);
      expect(await stale.json()).toMatchObject({
        error: {
          issues: expect.arrayContaining([
            expect.objectContaining({ code: "conflict", field: "name" }),
          ]),
        },
      });
    });

    it("rejects foreign users and invalid final references without writing", async () => {
      const fixture = await seedProject(database, "editor");
      const other = await seedProject(database, "editor");
      const ownerSession = await createSession(fixture.user.id);
      const otherSession = await createSession(other.user.id);
      const payload = {
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
      };
      expect((await POST(request(payload, otherSession))).status).toBe(403);
      const invalid = await POST(request(payload, ownerSession));
      expect(invalid.status).toBe(422);
      expect(await invalid.json()).toMatchObject({
        error: {
          issues: expect.arrayContaining([
            expect.objectContaining({ code: "missing-referenced-token" }),
          ]),
        },
      });
      expect(await listTokenReferencesByProjectId(database, fixture.project.id)).toEqual(
        [],
      );
      expect((await POST(request(payload, crypto.randomUUID()))).status).toBe(401);
    });

    it("applies one row from the staged state through the real save route", async () => {
      const fixture = await seedProject(database, "editor");
      const sessionId = await createSession(fixture.user.id);
      const [types, tokens, references] = await Promise.all([
        listTokenTypesByProjectId(database, fixture.project.id),
        listTokensByProjectId(database, fixture.project.id),
        listTokenReferencesByProjectId(database, fixture.project.id),
      ]);
      const model = buildTokenGraphViewModel(types, tokens, references);
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) =>
        POST(
          new Request(`${origin}/api/design-tokens/staged-changes`, {
            method: "POST",
            headers: {
              origin,
              "content-type": "application/json",
              cookie: `dso_session=${sessionId}`,
            },
            body: init?.body,
          }),
        ),
      );
      const hook = renderHook(() => useStagedContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StagedManifestProvider projectId={fixture.project.id} baseManifest={model}>
            {children}
          </StagedManifestProvider>
        ),
      });
      await waitFor(() => expect(hook.result.current.canApply).toBe(true));
      act(() => {
        hook.result.current.updateRow(fixture.referencedToken.id, { name: "saved" });
        hook.result.current.updateRow(fixture.referencingToken.id, {
          name: "still-draft",
        });
      });
      await act(async () => {
        expect(
          (await hook.result.current.applyRow(fixture.referencedToken.id)).status,
        ).toBe(200);
      });
      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual({
        ...fixture.referencedToken,
        name: "saved",
      });
      expect(
        findRowById(hook.result.current.draftModel, fixture.referencingToken.id)?.name,
      ).toBe("still-draft");
      expect(hook.result.current.changedRowCount).toBe(1);
    });
  },
);
