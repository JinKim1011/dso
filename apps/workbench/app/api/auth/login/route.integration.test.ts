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
      headers: { origin, "content-type": "application/json" },
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
      "SELECT action FROM audit_events WHERE user_id = $1",
      [user.id],
    );
    expect(audit.rows).toEqual([{ action: "login.succeeded" }]);
  });
});
