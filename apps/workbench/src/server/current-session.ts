import { getDatabasePool } from "@/server/database";
import { loadSecurityEnvironment } from "@/server/env";
import { getSessionCookie } from "@/server/session-cookie";
import { SessionExpiredError } from "@repo/application/errors";
import { authenticateSession } from "@repo/application/services/authentication";
import type { AuthorizationContext } from "@repo/application/types";
import { headers } from "next/headers";

export async function getCurrentSession(
  request?: Request,
): Promise<AuthorizationContext | null> {
  const environment = loadSecurityEnvironment(process.env);
  const requestHeaders = request?.headers ?? (await headers());

  const sessionId = getSessionCookie(
    { headers: requestHeaders },
    environment.sessionCookieName,
  );
  if (!sessionId) return null;

  try {
    return await authenticateSession(getDatabasePool(), sessionId);
  } catch (error) {
    if (error instanceof SessionExpiredError) return null;
    throw error;
  }
}
