import { InvalidCredentialsError, SessionExpiredError } from "@repo/application/errors";
import { verifyPassword } from "@repo/application/services/passwords";
import type { AuthorizationContext, LoginResult } from "@repo/application/types";
import { LoginRequest } from "@repo/contracts/operation";
import { insertAuditEvent } from "@repo/db/repositories/audit-events";
import { findActiveSessionById, insertSession } from "@repo/db/repositories/sessions";
import { findUserByEmail } from "@repo/db/repositories/users";
import { withTransaction } from "@repo/db/transaction";
import { Pool } from "pg";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1_000;

export async function login(database: Pool, request: LoginRequest): Promise<LoginResult> {
  const normalizedEmail = request.email.trim().toLowerCase();
  const user = await findUserByEmail(database, normalizedEmail);

  const passwordMatches = user
    ? await verifyPassword(user.passwordHash, request.password)
    : false;

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
  const session = await findActiveSessionById(database, sessionId);

  if (!session) {
    throw new SessionExpiredError();
  }

  return {
    userId: session.userId,
    sessionId: session.id,
  };
}
