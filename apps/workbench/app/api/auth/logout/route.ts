import { SESSION_COOKIE } from "@/server/auth-session-cookie";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import {
  getTrustedMutationOrigin,
  hasTrustedMutationOrigin,
} from "@/server/mutation-origin";
import { logout } from "@repo/application/services/authentication";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    const trustedOrigin = getTrustedMutationOrigin(process.env);
    if (!hasTrustedMutationOrigin(request, trustedOrigin)) {
      return failure(403, "invalid-origin", "Request origin is not allowed.");
    }

    const context = await getCurrentSession(request);
    if (!context) {
      return failure(401, "authentication-required", "Authentication is required.");
    }

    await logout(getDatabasePool(), context);
    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE.name, "", { ...SESSION_COOKIE, maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Logout request failed.", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return failure(500, "internal-error", "The request could not be completed.");
  }
}