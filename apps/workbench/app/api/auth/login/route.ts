import { SESSION_COOKIE } from "@/server/auth-session-cookie";
import { getDatabasePool } from "@/server/database";
import {
  getTrustedMutationOrigin,
  hasTrustedMutationOrigin,
} from "@/server/mutation-origin";
import { readJsonBody, RequestBodyError } from "@/server/request-body";
import { InvalidCredentialsError } from "@repo/application/errors";
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
  if (process.env.NODE_ENV !== "development") {
    return failure(404, "not-found", "Not found.");
  }

  try {
    const trustedOrigin = getTrustedMutationOrigin(process.env);
    if (!hasTrustedMutationOrigin(request, trustedOrigin)) {
      return failure(403, "invalid-origin", "Request origin is not allowed.");
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
    if (error instanceof RequestBodyError) {
      return failure(error.code === "body-too-large" ? 413 : 400, error.code, error.message);
    }
    if (error instanceof InvalidCredentialsError) {
      return failure(401, error.code, error.message);
    }

    console.error("Login request failed.", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return failure(500, "internal-error", "The request could not be completed.");
  }
}