import { mapApiError } from "@/server/api-error";
import { isTrustedMutationRequest } from "@/server/csrf";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { isPublishEnabled } from "@/server/env";
import { checkRateLimit, rateLimitResponse } from "@/server/rate-limit";
import { readJsonBody } from "@/server/request-body";
import { publishStagedChanges } from "@repo/application/services/staged-publishing";
import type { PublishStagedChangesResponse } from "@repo/contracts/operation";
import { parsePublishStagedChangesRequest } from "@repo/contracts/validation/operations/staged-changes";

export const runtime = "nodejs";

function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } } satisfies PublishStagedChangesResponse,
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isPublishEnabled(process.env)) {
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

    const context = await getCurrentSession(request);

    if (!context) {
      return failure(401, "authentication-required", "Authentication is required.");
    }

    const parsed = parsePublishStagedChangesRequest(await readJsonBody(request));

    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "invalid-request",
            message: "The request is not valid.",
            issues: parsed.issues,
          },
        } satisfies PublishStagedChangesResponse,
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (process.env.NODE_ENV === "production") {
      const decision = await checkRateLimit("publish", [
        context.userId,
        parsed.value.projectId.toLowerCase(),
      ]);

      if (!decision.allowed) {
        return rateLimitResponse(decision);
      }
    }

    const result = await publishStagedChanges(getDatabasePool(), context, parsed.value);

    return Response.json({ ok: true, ...result } satisfies PublishStagedChangesResponse, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return mapApiError(error);
  }
}
