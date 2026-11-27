import { getDatabasePool } from "@/server/database";
import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import {
  StagedContextProvider,
  useStagedContext,
} from "@/features/tokens/state/staged-context";
import { findRowById } from "@/features/tokens/state/staged-graph-model";
import { seedProject } from "@repo/application/fixtures";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { insertSession } from "@repo/db/repositories/sessions";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { insertToken, listTokensByProjectId } from "@repo/db/repositories/tokens";
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
  "publication HTTP and PostgreSQL integration",
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

    it("publishes staged UI changes through the real route and updates the draft", async () => {
      const fixture = await seedProject(database, "publisher");
      const sessionId = crypto.randomUUID();
      const now = Date.now();
      await insertSession(database, {
        id: sessionId,
        userId: fixture.user.id,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
      });
      const projectId = fixture.project.id;
      const base = buildTokenGraphViewModel(
        await listTokenTypesByProjectId(database, projectId),
        await listTokensByProjectId(database, projectId),
        await listTokenReferencesByProjectId(database, projectId),
      );
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (url, init) => {
          expect(url).toBe("/api/releases/publish");
          const headers = new Headers(init?.headers);
          headers.set("origin", origin);
          headers.set("cookie", `dso_session=${sessionId}`);
          return POST(new Request(`${origin}${url}`, { ...init, headers }));
        });
      const hook = renderHook(() => useStagedContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StagedContextProvider projectId={projectId} baseManifest={base}>
            {children}
          </StagedContextProvider>
        ),
      });
      await waitFor(() => expect(hook.result.current.canApply).toBe(true));
      act(() =>
        hook.result.current.updateRow(fixture.referencedToken.id, { name: "published" }),
      );
      await act(async () => {
        expect((await hook.result.current.applyDraft()).status).toBe(200);
      });
      expect(fetchSpy).toHaveBeenCalledOnce();
      expect(hook.result.current.changedRowCount).toBe(0);
      expect(
        findRowById(hook.result.current.baseModel, fixture.referencedToken.id)?.name,
      ).toBe("published");
      expect((await database.query("SELECT version, status FROM releases")).rows).toEqual(
        [{ version: "1", status: "published" }],
      );
      expect((await database.query("SELECT action FROM audit_events")).rows).toHaveLength(
        2,
      );
      hook.unmount();
    });

    it("rejects a generated CSS path collision before publishing", async () => {
      const fixture = await seedProject(database, "publisher");
      const sessionId = crypto.randomUUID();
      const now = Date.now();
      await insertSession(database, {
        id: sessionId,
        userId: fixture.user.id,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
      });
      const duplicate = {
        ...fixture.referencedToken,
        id: crypto.randomUUID(),
        name: "reserved-name",
      };
      await insertToken(database, duplicate);
      const response = await POST(
        new Request(`${origin}/api/releases/publish`, {
          method: "POST",
          headers: {
            origin,
            "content-type": "application/json",
            "x-dso-csrf": "1",
            cookie: `dso_session=${sessionId}`,
          },
          body: JSON.stringify({
            requestId: crypto.randomUUID(),
            projectId: fixture.project.id,
            changes: [
              {
                tokenId: fixture.referencedToken.id,
                name: {
                  before: fixture.referencedToken.name,
                  after: duplicate.name,
                },
                references: [],
              },
            ],
          }),
        }),
      );

      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({
        error: {
          code: "domain-validation",
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: "duplicate-css-variable",
              tokenId: fixture.referencedToken.id,
            }),
          ]),
        },
      });
      expect(await listTokensByProjectId(database, fixture.project.id)).toContainEqual(
        fixture.referencedToken,
      );
      expect((await database.query("SELECT id FROM releases")).rows).toHaveLength(0);
      expect((await database.query("SELECT id FROM audit_events")).rows).toHaveLength(0);
    });

    it("authenticates, publishes, and rejects stale changes and unauthorized callers", async () => {
      const fixture = await seedProject(database, "publisher");
      const editor = await seedProject(database, "editor");
      const now = Date.now();
      const sessionId = crypto.randomUUID();
      await insertSession(database, {
        id: sessionId,
        userId: fixture.user.id,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
      });
      const editorSession = crypto.randomUUID();
      await insertSession(database, {
        id: editorSession,
        userId: editor.user.id,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
      });
      const payload = {
        requestId: crypto.randomUUID(),
        projectId: fixture.project.id,
        changes: [
          {
            tokenId: fixture.referencedToken.id,
            name: { before: fixture.referencedToken.name, after: "published" },
            references: [],
          },
        ],
      };
      const makeRequest = (body: unknown, session = sessionId) =>
        new Request(`${origin}/api/releases/publish`, {
          method: "POST",
          headers: {
            origin,
            "content-type": "application/json",
            "x-dso-csrf": "1",
            cookie: `dso_session=${session}`,
          },
          body: JSON.stringify(body),
        });

      const first = await POST(makeRequest(payload));
      expect(first.status).toBe(200);
      const result = await first.json();
      expect(result).toMatchObject({
        ok: true,
        release: { version: "1", status: "published" },
      });
      const replay = await POST(makeRequest(payload));
      expect(replay.status).toBe(200);
      expect(await replay.json()).toEqual(result);
      expect((await POST(makeRequest(payload, editorSession))).status).toBe(403);
      expect((await database.query("SELECT id FROM releases")).rows).toHaveLength(1);
      expect((await database.query("SELECT id FROM audit_events")).rows).toHaveLength(2);
    });
  },
);
