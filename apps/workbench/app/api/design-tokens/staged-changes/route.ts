import { mapApiError } from "@/server/api-error";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { isTrustedMutationRequest } from "@/server/csrf";
import { readJsonBody } from "@/server/request-body";
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
    if (!isTrustedMutationRequest(request, process.env)) {
      return failure(403, "request-rejected", "The request was rejected.");
    }

    const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
    if (mediaType?.toLowerCase() !== "application/json") {
      return failure(
        415,
        "unsupported-media-type",
        "Content-Type must be application/json.",
      );
    }

    const authContext = await getCurrentSession(request);
    if (!authContext) {
      return failure(401, "authentication-required", "Authentication is required.");
    }
    const database = getDatabasePool();

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

    const result = await saveStagedChanges(database, authContext, parsed.value);
    return Response.json({ ok: true, ...result } satisfies SaveStagedChangesResponse, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return mapApiError(error);
  }
}
