import { getDatabasePool } from "@/server/database";
import { hashPassword } from "@repo/application/services/passwords";
import { insertSession } from "@repo/db/repositories/sessions";
import { insertUser } from "@repo/db/repositories/users";
import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));

let database: Awaited<ReturnType<typeof setupDatabase>>;

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "session lookup HTTP and PostgreSQL integration",
  () => {
    beforeAll(async () => {
      database = await setupDatabase();
    });
    beforeEach(async () => {
      await resetDatabase(database);
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("SESSION_COOKIE_NAME", "test_session");
      vi.mocked(getDatabasePool).mockReturnValue(database);
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetAllMocks();
    });
    afterAll(async () => {
      await closeDatabase();
    });

    function request(cookie?: string): Request {
      return new Request("http://localhost:3000/api/auth/session", {
        headers: cookie === undefined ? {} : { cookie },
      });
    }

    it("returns the authenticated user's safe details and rejects invalid sessions", async () => {
      const user = await insertUser(database, {
        id: crypto.randomUUID(),
        email: "user@example.test",
        passwordHash: await hashPassword("test-password"),
        createdAt: new Date().toISOString(),
      });
      const now = Date.now();
      const activeId = crypto.randomUUID();
      const expiredId = crypto.randomUUID();
      await insertSession(database, {
        id: activeId,
        userId: user.id,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
      });
      await insertSession(database, {
        id: expiredId,
        userId: user.id,
        createdAt: new Date(now - 120_000).toISOString(),
        expiresAt: new Date(now - 60_000).toISOString(),
      });

      const response = await GET(request(`test_session=${activeId}`));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({ user: { id: user.id, email: user.email } });

      for (const cookie of [
        undefined,
        "test_session=",
        "test_session=invalid",
        `test_session=${crypto.randomUUID()}`,
        `test_session=${expiredId}`,
        `test_session=${activeId}; test_session=${activeId}`,
      ]) {
        const rejected = await GET(request(cookie));
        expect(rejected.status).toBe(401);
        expect(rejected.headers.get("cache-control")).toBe("no-store");
        expect(await rejected.json()).toEqual({
          ok: false,
          error: { code: "authentication-required", message: "Authentication is required." },
        });
      }
    });
  },
);
