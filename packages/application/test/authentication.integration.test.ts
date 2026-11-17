import { SessionExpiredError } from "@repo/application/errors";
import {
  authenticateSession,
  getAuthenticatedUser,
  login,
  logout,
} from "@repo/application/services/authentication";
import { hashPassword } from "@repo/application/services/passwords";
import { insertSession } from "@repo/db/repositories/sessions";
import { insertUser } from "@repo/db/repositories/users";
import { resetDatabase } from "@repo/db/test/database";
import { getTestDatabase } from "@repo/db/test/setup";
import { beforeEach, describe, expect, it } from "vitest";

describe("Authentication service integration", () => {
  beforeEach(async () => {
    await resetDatabase(getTestDatabase());
  });

  it("creates a session and successful-login audit event", async () => {
    const database = getTestDatabase();
    const password = "correct-password";

    const user = await insertUser(database, {
      id: crypto.randomUUID(),
      email: " User@Example.Test ",
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    });

    const result = await login(database, {
      email: "USER@example.test",
      password,
    });

    expect(result.sessionId).toEqual(expect.any(String));
    expect(result.response).toMatchObject({
      user: {
        id: user.id,
        email: "user@example.test",
      },
      expiresAt: expect.any(String),
    });

    expect(result.response).not.toHaveProperty("passwordHash");
    expect(result.response.user).not.toHaveProperty("passwordHash");

    const sessions = await database.query(
      `
        SELECT id, user_id, expires_at
        FROM sessions
        WHERE id = $1
      `,
      [result.sessionId],
    );

    expect(sessions.rows).toHaveLength(1);
    expect(sessions.rows[0]).toMatchObject({
      id: result.sessionId,
      user_id: user.id,
    });

    const auditEvents = await database.query(
      `
        SELECT user_id, project_id, action, resource_type, resource_id
        FROM audit_events
        WHERE user_id = $1
      `,
      [user.id],
    );

    expect(auditEvents.rows).toEqual([
      {
        user_id: user.id,
        project_id: null,
        action: "login.succeeded",
        resource_type: "account",
        resource_id: null,
      },
    ]);
  });

  it("audits rejected credentials without treating the attempted account as the actor", async () => {
    const database = getTestDatabase();

    const user = await insertUser(database, {
      id: crypto.randomUUID(),
      email: "user@example.test",
      passwordHash: await hashPassword("correct-password"),
      createdAt: new Date().toISOString(),
    });

    await expect(
      login(database, {
        email: user.email,
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      code: "invalid-credentials",
    });
    await expect(
      login(database, {
        email: "missing@example.test",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      code: "invalid-credentials",
    });

    const sessions = await database.query(
      `
        SELECT COUNT(*)::int AS count
        FROM sessions
        WHERE user_id = $1
      `,
      [user.id],
    );

    const auditEvents = await database.query(
      `
        SELECT user_id, project_id, action, resource_type, resource_id, metadata
        FROM audit_events
        ORDER BY resource_id NULLS FIRST
      `,
    );

    expect(sessions.rows[0].count).toBe(0);
    expect(auditEvents.rows).toEqual([
      {
        user_id: null,
        project_id: null,
        action: "login.failed",
        resource_type: "account",
        resource_id: null,
        metadata: null,
      },
      {
        user_id: null,
        project_id: null,
        action: "login.failed",
        resource_type: "account",
        resource_id: user.id,
        metadata: null,
      },
    ]);
  });

  it("propagates failed-login audit errors instead of reporting invalid credentials", async () => {
    const database = getTestDatabase();
    await database.query(`
      CREATE FUNCTION fail_rejected_login_audit_insert()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.action = 'login.failed' THEN
          RAISE EXCEPTION 'forced failed-login audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await database.query(`
      CREATE TRIGGER fail_rejected_login_audit
      BEFORE INSERT ON audit_events
      FOR EACH ROW EXECUTE FUNCTION fail_rejected_login_audit_insert()
    `);
    try {
      await expect(
        login(database, { email: "missing@example.test", password: "wrong-password" }),
      ).rejects.toThrow("forced failed-login audit failure");
      expect((await database.query("SELECT id FROM sessions")).rows).toEqual([]);
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    } finally {
      await database.query(
        "DROP TRIGGER IF EXISTS fail_rejected_login_audit ON audit_events",
      );
      await database.query("DROP FUNCTION IF EXISTS fail_rejected_login_audit_insert()");
    }
  });

  it("rolls back session creation when login auditing fails", async () => {
    const database = getTestDatabase();
    const password = "correct-password";

    const user = await insertUser(database, {
      id: crypto.randomUUID(),
      email: "user@example.test",
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    });

    await database.query(`
      CREATE FUNCTION fail_login_audit_insert()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.action = 'login.succeeded' THEN
          RAISE EXCEPTION 'forced login audit failure';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await database.query(`
      CREATE TRIGGER fail_login_audit
      BEFORE INSERT ON audit_events
      FOR EACH ROW
      EXECUTE FUNCTION fail_login_audit_insert()
    `);

    try {
      await expect(
        login(database, {
          email: user.email,
          password,
        }),
      ).rejects.toThrow("forced login audit failure");

      const sessions = await database.query(
        `
          SELECT COUNT(*)::int AS count
          FROM sessions
          WHERE user_id = $1
        `,
        [user.id],
      );

      expect(sessions.rows[0].count).toBe(0);
    } finally {
      await database.query("DROP TRIGGER IF EXISTS fail_login_audit ON audit_events");
      await database.query("DROP FUNCTION IF EXISTS fail_login_audit_insert()");
    }
  });

  it("returns the same error for an unknown email and wrong password", async () => {
    const database = getTestDatabase();

    await insertUser(database, {
      id: crypto.randomUUID(),
      email: "user@example.test",
      passwordHash: await hashPassword("correct-password"),
      createdAt: new Date().toISOString(),
    });

    await expect(
      login(database, {
        email: "user@example.test",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      code: "invalid-credentials",
      message: "Invalid email or password.",
    });

    await expect(
      login(database, {
        email: "missing@example.test",
        password: "correct-password",
      }),
    ).rejects.toMatchObject({
      code: "invalid-credentials",
      message: "Invalid email or password.",
    });
  });

  it("sets the session expiration to eight hours after creation", async () => {
    const database = getTestDatabase();
    const password = "correct-password";

    const user = await insertUser(database, {
      id: crypto.randomUUID(),
      email: "user@example.test",
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    });

    const result = await login(database, {
      email: user.email,
      password,
    });

    const sessions = await database.query<{
      created_at: Date;
      expires_at: Date;
    }>(
      `
      SELECT created_at, expires_at
      FROM sessions
      WHERE id = $1
    `,
      [result.sessionId],
    );

    expect(sessions.rows).toHaveLength(1);

    const session = sessions.rows[0]!;
    const durationMs = session.expires_at.getTime() - session.created_at.getTime();

    expect(durationMs).toBe(8 * 60 * 60 * 1_000);
    expect(result.response.expiresAt).toBe(session.expires_at.toISOString());
  });

  it("resolves an active session", async () => {
    const database = getTestDatabase();
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

    await insertUser(database, {
      id: userId,
      email: "user@example.test",
      passwordHash: await hashPassword("test-password"),
      createdAt: new Date().toISOString(),
    });

    await insertSession(database, {
      id: sessionId,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await expect(authenticateSession(database, sessionId)).resolves.toEqual({
      userId,
      sessionId,
    });
  });

  it("returns only safe user details for an authenticated session", async () => {
    const database = getTestDatabase();
    const user = await insertUser(database, {
      id: crypto.randomUUID(),
      email: "User@Example.Test",
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

    const context = await authenticateSession(database, sessionId);
    await expect(getAuthenticatedUser(database, context)).resolves.toEqual({
      id: user.id,
      email: "user@example.test",
    });
  });

  it("reports an unexpected missing authenticated user", async () => {
    await expect(
      getAuthenticatedUser(getTestDatabase(), {
        userId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
      }),
    ).rejects.toThrow("Authenticated user not found.");
  });

  it("rejects an expired session", async () => {
    const database = getTestDatabase();
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

    await insertUser(database, {
      id: userId,
      email: "user@example.test",
      passwordHash: await hashPassword("test-password"),
      createdAt: new Date().toISOString(),
    });

    await insertSession(database, {
      id: sessionId,
      userId,
      createdAt: new Date(Date.now() - 120_000).toISOString(),
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    await expect(authenticateSession(database, sessionId)).rejects.toMatchObject({
      code: "session-expired",
    });
  });

  it("rejects an unknown session", async () => {
    await expect(
      authenticateSession(getTestDatabase(), crypto.randomUUID()),
    ).rejects.toMatchObject({
      code: "session-expired",
    });
  });

  it.each(["not-a-uuid", "00000000-0000-0000-0000-00000000000z"])(
    "rejects malformed session IDs without querying PostgreSQL",
    async (sessionId) => {
      await expect(
        authenticateSession(getTestDatabase(), sessionId),
      ).rejects.toBeInstanceOf(SessionExpiredError);
    },
  );

  it("logout removes the session and records the authenticated actor once", async () => {
    const database = getTestDatabase();
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

    await insertUser(database, {
      id: userId,
      email: "user@example.test",
      passwordHash: await hashPassword("test-password"),
      createdAt: new Date().toISOString(),
    });

    await insertSession(database, {
      id: sessionId,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await Promise.all([
      logout(database, { userId, sessionId }),
      logout(database, { userId, sessionId }),
    ]);

    const result = await database.query("SELECT id FROM sessions WHERE id = $1", [
      sessionId,
    ]);

    expect(result.rows).toHaveLength(0);
    const audit = await database.query(
      "SELECT user_id, project_id, action, resource_type, resource_id, metadata FROM audit_events",
    );
    expect(audit.rows).toEqual([
      {
        user_id: userId,
        project_id: null,
        action: "logout",
        resource_type: "account",
        resource_id: null,
        metadata: null,
      },
    ]);
  });

  it("logout is safe when the session is already removed", async () => {
    const database = getTestDatabase();

    await expect(
      logout(database, {
        userId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
      }),
    ).resolves.toBeUndefined();
    expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
  });

  it("does not remove or audit a session owned by a different user", async () => {
    const database = getTestDatabase();
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

    await logout(database, { userId: crypto.randomUUID(), sessionId });
    expect((await database.query("SELECT id FROM sessions")).rows).toEqual([
      { id: sessionId },
    ]);
    expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
  });

  it("rolls back session deletion when logout auditing fails", async () => {
    const database = getTestDatabase();
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
    await database.query(`
      CREATE FUNCTION fail_logout_audit_insert()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.action = 'logout' THEN
          RAISE EXCEPTION 'forced logout audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await database.query(`
      CREATE TRIGGER fail_logout_audit
      BEFORE INSERT ON audit_events
      FOR EACH ROW EXECUTE FUNCTION fail_logout_audit_insert()
    `);
    try {
      await expect(logout(database, { userId: user.id, sessionId })).rejects.toThrow(
        "forced logout audit failure",
      );
      expect((await database.query("SELECT id FROM sessions")).rows).toEqual([
        { id: sessionId },
      ]);
      expect((await database.query("SELECT id FROM audit_events")).rows).toEqual([]);
    } finally {
      await database.query("DROP TRIGGER IF EXISTS fail_logout_audit ON audit_events");
      await database.query("DROP FUNCTION IF EXISTS fail_logout_audit_insert()");
    }
  });

  it("rejects an unauthenticated session", async () => {
    await expect(
      authenticateSession(getTestDatabase(), crypto.randomUUID()),
    ).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
