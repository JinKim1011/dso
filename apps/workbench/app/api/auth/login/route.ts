import { mapApiError } from "@/server/api-error";
import { SESSION_COOKIE } from "@/server/auth-session-cookie";
import { getDatabasePool } from "@/server/database";
import { isTrustedMutationRequest } from "@/server/csrf";
import { isWorkbenchAuthenticationEnabled } from "@/server/env";
import { readJsonBody } from "@/server/request-body";
import { login } from "@repo/application/services/authentication";
import { parseLoginRequest } from "@repo/contracts/validation/operations/authentication";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isWorkbenchAuthenticationEnabled(process.env)) {
    return failure(404, "not-found", "Not found.");
  }

  try {
    if (!isTrustedMutationRequest(request, process.env)) {
      return failure(403, "request-rejected", "The request was rejected.");
    }

    const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
    if (mediaType?.toLowerCase() !== "application/json") {
      return failure(415, "unsupported-media-type", "Content-Type must be application/json.");
    }

    const parsed = parseLoginRequest(await readJsonBody(request));
    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "invalid-request",
            message: "The request is not valid.",
            issues: parsed.issues,
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await login(getDatabasePool(), parsed.value);
    const response = NextResponse.json(result.response, {
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set(SESSION_COOKIE.name, result.sessionId, SESSION_COOKIE);
    return response;
  } catch (error) {
    return mapApiError(error);
  }
}