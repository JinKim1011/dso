import { mapApiError } from "@/server/api-error";
import { isTrustedMutationRequest } from "@/server/csrf";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { readJsonBody } from "@/server/request-body";
import { revokeApiKey } from "@repo/application/services/api-keys";
import {
  parseRevokeApiKeyBody,
  parseRevokeApiKeyRequest,
} from "@repo/contracts/validation/operations/api-keys";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ apiKeyId: string }>;
};

function failure(status: number, code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  routeContext: RouteContext,
): Promise<Response> {
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

    const context = await getCurrentSession(request);
    if (!context) {
      return failure(401, "authentication-required", "Authentication is required.");
    }

    const { apiKeyId } = await routeContext.params;

    const body = parseRevokeApiKeyBody(await readJsonBody(request));
    if (!body.success) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "invalid-request",
            message: "The request is not valid.",
            issues: body.issues,
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const parsed = parseRevokeApiKeyRequest({ ...body.value, apiKeyId });

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

    const revoked = await revokeApiKey(getDatabasePool(), context, parsed.value);

    return Response.json(
      {
        ok: true,
        apiKey: {
          id: revoked.id,
          projectId: revoked.projectId,
          keyIdentifier: revoked.keyIdentifier,
          scope: revoked.scope,
          expiresAt: revoked.expiresAt,
          revokedAt: revoked.revokedAt,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapApiError(error);
  }
}
