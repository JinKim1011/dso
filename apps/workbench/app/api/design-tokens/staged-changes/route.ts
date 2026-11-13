import { getDatabasePool } from "@/server/database";
import { loadSecurityEnvironment } from "@/server/env";
import {
  getTrustedMutationOrigin,
  hasTrustedMutationOrigin,
} from "@/server/mutation-origin";
import { readJsonBody, RequestBodyError } from "@/server/request-body";
import { getSessionCookie } from "@/server/session-cookie";
import {
  ProjectAccessDeniedError,
  ResourceNotFoundError,
  SessionExpiredError,
  StagedChangesConflictError,
  StagedChangesValidationError,
} from "@repo/application/errors";
import { authenticateSession } from "@repo/application/services/authentication";
import { saveStagedChanges } from "@repo/application/services/staged-changes";
import type { SaveStagedChangesResponse } from "@repo/contracts/operation";
import { parseSaveStagedChangesRequest } from "@repo/contracts/validation/operations/staged-changes";

export const runtime = "nodejs";

function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } } satisfies SaveStagedChangesResponse,
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
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
      return failure(
        415,
        "unsupported-media-type",
        "Content-Type must be application/json.",
      );
    }

    const environment = loadSecurityEnvironment(process.env);
    const sessionId = getSessionCookie(request, environment.sessionCookieName);
    if (!sessionId) {
      return failure(401, "authentication-required", "Authentication is required.");
    }
    const database = getDatabasePool();
    const context = await authenticateSession(database, sessionId);

    const body = await readJsonBody(request);
    const parsed = parseSaveStagedChangesRequest(body);
    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "invalid-request",
            message: "The request is not valid.",
            issues: parsed.issues,
          },
        } satisfies SaveStagedChangesResponse,
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const result = await saveStagedChanges(database, context, parsed.value);
    return Response.json({ ok: true, ...result } satisfies SaveStagedChangesResponse, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return failure(
        error.code === "body-too-large" ? 413 : 400,
        error.code,
        error.message,
      );
    }

    if (error instanceof SessionExpiredError) {
      return failure(401, "authentication-required", "Authentication is required.");
    }

    if (error instanceof ProjectAccessDeniedError) {
      return failure(403, error.code, error.message);
    }

    if (error instanceof ResourceNotFoundError) {
      return failure(404, error.code, error.message);
    }

    if (
      error instanceof StagedChangesConflictError ||
      error instanceof StagedChangesValidationError
    ) {
      return Response.json(
        {
          ok: false,
          error: { code: error.code, message: error.message, issues: error.issues },
        } satisfies SaveStagedChangesResponse,
        {
          status: error instanceof StagedChangesConflictError ? 409 : 422,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    console.error("Staged changes request failed.", {
      errorType: error instanceof Error ? error.name : typeof error,
    });

    return failure(500, "internal-error", "The request could not be completed.");
  }
}
