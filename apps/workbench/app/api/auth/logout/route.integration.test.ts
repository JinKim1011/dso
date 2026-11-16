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
      vi.stubEnv("NODE_ENV", "test");
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
        headers: { origin: requestOrigin, cookie },
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
    });
  },
);
