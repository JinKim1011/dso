import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { getAuthenticatedUser } from "@repo/application/services/authentication";
import type { SessionLookupResponse } from "@repo/contracts/operation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request): Promise<Response> {
  try {
    const context = await getCurrentSession(request);
    if (!context) {
      return failure(401, "authentication-required", "Authentication is required.");
    }

    const user = await getAuthenticatedUser(getDatabasePool(), context);
    return Response.json(
      { user: { id: user.id, email: user.email } } satisfies SessionLookupResponse,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Session lookup failed.", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return failure(500, "internal-error", "The request could not be completed.");
  }
}