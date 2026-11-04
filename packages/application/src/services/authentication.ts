import { InvalidCredentialsError, SessionExpiredError } from "@repo/application/errors";
import { verifyPassword } from "@repo/application/services/passwords";
import type { AuthorizationContext, LoginResult } from "@repo/application/types";
import { LoginRequest } from "@repo/contracts/operation";
import { insertAuditEvent } from "@repo/db/repositories/audit-events";
import {
  deleteSession,
  findActiveSessionById,
  insertSession,
} from "@repo/db/repositories/sessions";
import {
  canonicalizeEmail,
  findUserByEmail,
} from "@repo/db/repositories/users";
import { withTransaction } from "@repo/db/transaction";
import { Pool } from "pg";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1_000;

const DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=19456,t=2,p=1$...";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function login(database: Pool, request: LoginRequest): Promise<LoginResult> {
  const normalizedEmail = canonicalizeEmail(request.email);
  const user = await findUserByEmail(database, normalizedEmail);

  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(passwordHash, request.password);

  if (!user || !passwordMatches) {
    throw new InvalidCredentialsError();
  }

  return withTransaction(database, async (client) => {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SESSION_DURATION_MS);

    const sessionId = crypto.randomUUID();

    const session = await insertSession(client, {
      id: sessionId,
      userId: user.id,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    await insertAuditEvent(client, {
      id: crypto.randomUUID(),
      userId: session.userId,
      projectId: null,
      action: "login.succeeded",
      resourceType: "account",
      resourceId: null,
      createdAt: session.createdAt,
    });

    return {
      response: {
        user: {
          id: user.id,
          email: user.email,
        },
        expiresAt: expiresAt.toISOString(),
      },
      sessionId,
    };
  });
}

export async function authenticateSession(
  database: Pool,
  sessionId: string,
): Promise<AuthorizationContext> {
  if (sessionId.length !== 36 || UUID_PATTERN.test(sessionId)) {
    throw new SessionExpiredError();
  }

  const session = await findActiveSessionById(database, sessionId);

  if (!session) {
    throw new SessionExpiredError();
  }

  return {
    userId: session.userId,
    sessionId: session.id,
  };
}

export async function logout(
  database: Pool,
  context: AuthorizationContext,
): Promise<void> {
  await deleteSession(database, context.sessionId);
}
