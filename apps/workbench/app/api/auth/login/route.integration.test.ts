import { getDatabasePool } from "@/server/database";
import { authenticateSession } from "@repo/application/services/authentication";
import { hashPassword } from "@repo/application/services/passwords";
import { insertUser } from "@repo/db/repositories/users";
import { closeDatabase, resetDatabase, setupDatabase } from "@repo/db/test/database";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/config", () => ({
  securityEnvironment: {
    sessionCookieName: "dso_session",
    nodeEnv: "test",
    databaseUrl: "postgres://localhost/example",
  },
}));
vi.mock("@/server/database", () => ({ getDatabasePool: vi.fn() }));

const origin = "http://localhost:3000";
let database: Awaited<ReturnType<typeof setupDatabase>>;

describe.skipIf(!process.env.TEST_DATABASE_URL)("login HTTP and PostgreSQL integration", () => {
  beforeAll(async () => {
    database = await setupDatabase();
  });
  beforeEach(async () => {
    await resetDatabase(database);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DSO_WORKBENCH_ORIGIN", origin);
    vi.mocked(getDatabasePool).mockReturnValue(database);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });
  afterAll(async () => {
    await closeDatabase();
  });

  function request(email: string, password: string): Request {
    return new Request(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { origin, "content-type": "application/json", "x-dso-csrf": "1" },
      body: JSON.stringify({ email, password }),
    });
  }

  it("creates an authenticated session and returns the same error for invalid credentials", async () => {
    const user = await insertUser(database, {
      id: crypto.randomUUID(),
      email: "user@example.test",
      passwordHash: await hashPassword("correct-password"),
      createdAt: new Date().toISOString(),
    });

    expect((await POST(request("not-an-email", "wrong-password"))).status).toBe(400);
    expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    const wrongPassword = await POST(request(user.email, "wrong-password"));
    const unknownUser = await POST(request("missing@example.test", "wrong-password"));
    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownUser.json());
    expect(wrongPassword.headers.get("set-cookie")).toBeNull();
    expect(unknownUser.headers.get("set-cookie")).toBeNull();

    const response = await POST(request(user.email, "correct-password"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ user: { id: user.id, email: user.email }, expiresAt: expect.any(String) });
    const cookie = response.headers.get("set-cookie");
    const sessionId = cookie?.match(/^dso_session=([^;]+)/)?.[1];
    expect(sessionId).toBeDefined();
    expect(body).not.toHaveProperty("sessionId");
    expect(await authenticateSession(database, sessionId!)).toEqual({ userId: user.id, sessionId });

    const audit = await database.query(
      `SELECT user_id, action, resource_id, metadata FROM audit_events
       ORDER BY action, resource_id NULLS FIRST`,
    );
    expect(audit.rows).toEqual([
      { user_id: null, action: "login.failed", resource_id: null, metadata: null },
      { user_id: null, action: "login.failed", resource_id: user.id, metadata: null },
      { user_id: user.id, action: "login.succeeded", resource_id: null, metadata: null },
    ]);
  });

  it("returns a generic 500 when a failed-login audit cannot be saved", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await database.query(`
      CREATE FUNCTION fail_http_login_audit()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.action = 'login.failed' THEN
          RAISE EXCEPTION 'private audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await database.query(`
      CREATE TRIGGER fail_http_login_audit
      BEFORE INSERT ON audit_events
      FOR EACH ROW EXECUTE FUNCTION fail_http_login_audit()
    `);
    try {
      const response = await POST(request("missing@example.test", "wrong-password"));
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
      expect(JSON.stringify(log.mock.calls)).not.toContain("missing@example.test");
      expect(JSON.stringify(log.mock.calls)).not.toContain("wrong-password");
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
      expect((await database.query("SELECT id FROM sessions")).rows).toEqual([]);
    } finally {
      await database.query("DROP TRIGGER IF EXISTS fail_http_login_audit ON audit_events");
      await database.query("DROP FUNCTION IF EXISTS fail_http_login_audit()");
      log.mockRestore();
    }
  });
});
