import { login } from "@repo/application/services/authentication";
import { hashPassword } from "@repo/application/services/passwords";
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
      email: "user@example.test",
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
        email: user.email,
      },
      expiresAt: expect.any(String),
    });

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

  it("does not create a session or audit event for invalid credentials", async () => {
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
        SELECT COUNT(*)::int AS count
        FROM audit_events
        WHERE user_id = $1
      `,
      [user.id],
    );

    expect(sessions.rows[0].count).toBe(0);
    expect(auditEvents.rows[0].count).toBe(0);
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
});
