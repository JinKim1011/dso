import { mapApiError } from "@/server/api-error";
import { SESSION_COOKIE } from "@/server/auth-session-cookie";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { isTrustedMutationRequest } from "@/server/csrf";
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
  if (process.env.NODE_ENV !== "development") {
    return failure(404, "not-found", "Not found.");
  }

  try {
    if (!isTrustedMutationRequest(request, process.env)) {
      return failure(403, "request-rejected", "The request was rejected.");
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
    return mapApiError(error);
  }
}