import { getDatabasePool } from "@/server/database";
import { hashPassword } from "@repo/application/services/passwords";
import { insertSession } from "@repo/db/repositories/sessions";
import { insertUser } from "@repo/db/repositories/users";
import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../session/route";
import { POST } from "./route";

vi.mock("@/server/config", () => ({
  securityEnvironment: {
    sessionCookieName: "test_session",
    nodeEnv: "test",
    databaseUrl: "postgres://localhost/example",
  },
}));
vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));

const origin = "http://localhost:3000";
let database: Awaited<ReturnType<typeof setupDatabase>>;

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "logout HTTP and PostgreSQL integration",
  () => {
    beforeAll(async () => { database = await setupDatabase(); });
    beforeEach(async () => {
      await resetDatabase(database);
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
      vi.stubEnv("SESSION_COOKIE_NAME", "test_session");
      vi.mocked(getDatabasePool).mockReturnValue(database);
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetAllMocks();
    });
    afterAll(async () => { await closeDatabase(); });

    function request(cookie: string, requestOrigin = origin): Request {
      return new Request(`${origin}/api/auth/logout`, {
        method: "POST",
        headers: { origin: requestOrigin, cookie, "x-dso-csrf": "1" },
      });
    }

    it("deletes only the authenticated session and rejects its reuse", async () => {
      const user = await insertUser(database, {
        id: crypto.randomUUID(),
        email: "user@example.test",
        passwordHash: await hashPassword("test-password"),
        createdAt: new Date().toISOString(),
      });
      const sessionId = crypto.randomUUID();
      const otherId = crypto.randomUUID();
      const now = Date.now();
      for (const id of [sessionId, otherId]) {
        await insertSession(database, {
          id,
          userId: user.id,
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + 60_000).toISOString(),
        });
      }

      const cookie = `test_session=${sessionId}`;
      expect((await POST(request(cookie, "http://evil.test"))).status).toBe(403);
      const response = await POST(request(cookie));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(response.headers.get("set-cookie")).toContain("test_session=");
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
      const rows = await database.query("SELECT id FROM sessions WHERE user_id = $1", [user.id]);
      expect(rows.rows).toEqual([{ id: otherId }]);
      const lookup = new Request(`${origin}/api/auth/session`, { headers: { cookie } });
      expect((await GET(lookup)).status).toBe(401);
      expect((await POST(request(cookie))).status).toBe(401);
      const audit = await database.query(
        "SELECT user_id, project_id, action, resource_type, resource_id, metadata FROM audit_events",
      );
      expect(audit.rows).toEqual([
        {
          user_id: user.id,
          project_id: null,
          action: "logout",
          resource_type: "account",
          resource_id: null,
          metadata: null,
        },
      ]);
    });

    it("rejects missing, invalid, duplicate, and expired sessions", async () => {
      const user = await insertUser(database, {
        id: crypto.randomUUID(),
        email: "user@example.test",
        passwordHash: await hashPassword("test-password"),
        createdAt: new Date().toISOString(),
      });
      const expiredId = crypto.randomUUID();
      const now = Date.now();
      await insertSession(database, {
        id: expiredId,
        userId: user.id,
        createdAt: new Date(now - 120_000).toISOString(),
        expiresAt: new Date(now - 60_000).toISOString(),
      });
      for (const cookie of [
        "",
        "test_session=invalid",
        `test_session=${crypto.randomUUID()}`,
        `test_session=${expiredId}`,
        `test_session=${expiredId}; test_session=${expiredId}`,
      ]) {
        const response = await POST(request(cookie));
        expect(response.status).toBe(401);
        expect(response.headers.get("set-cookie")).toBeNull();
      }
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    });

    it("returns a generic 500 and keeps the session if logout auditing fails", async () => {
      const user = await insertUser(database, {
        id: crypto.randomUUID(),
        email: "user@example.test",
        passwordHash: await hashPassword("test-password"),
        createdAt: new Date().toISOString(),
      });
      const sessionId = crypto.randomUUID();
      await insertSession(database, {
        id: sessionId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      await database.query(`
        CREATE FUNCTION fail_http_logout_audit()
        RETURNS trigger AS $$
        BEGIN
          IF NEW.action = 'logout' THEN
            RAISE EXCEPTION 'private audit failure';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      await database.query(`
        CREATE TRIGGER fail_http_logout_audit
        BEFORE INSERT ON audit_events
        FOR EACH ROW EXECUTE FUNCTION fail_http_logout_audit()
      `);
      try {
        const response = await POST(request(`test_session=${sessionId}`));
        expect(response.status).toBe(500);
        expect(response.headers.get("set-cookie")).toBeNull();
        expect(await response.json()).toEqual({
          ok: false,
          error: {
            code: "internal-error",
            message: "The request could not be completed.",
            correlationId: expect.any(String),
          },
        });
        expect(log).toHaveBeenCalledOnce();
        expect(JSON.stringify(log.mock.calls)).not.toContain("private audit failure");
        expect(JSON.stringify(log.mock.calls)).not.toContain(sessionId);
        expect((await database.query("SELECT id FROM sessions")).rows).toEqual([
          { id: sessionId },
        ]);
        expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
      } finally {
        await database.query(
          "DROP TRIGGER IF EXISTS fail_http_logout_audit ON audit_events",
        );
        await database.query("DROP FUNCTION IF EXISTS fail_http_logout_audit()");
        log.mockRestore();
      }
    });
  },
);
