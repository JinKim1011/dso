import { mapApiError } from "@/server/api-error";
import { getBearerApiKeyCredential } from "@/server/bearer-authentication";
import { getReleaseSigningConfiguration } from "@/server/config";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { checkRateLimit, rateLimitResponse } from "@/server/rate-limit";
import {
  authorizeReleaseDownloadApiKey,
  downloadReleaseWithAuthorizedApiKey,
} from "@repo/application/services/download-release";
import { getPublishedReleaseForSession } from "@repo/application/services/published-releases";
import { parseDownloadReleaseRequest } from "@repo/contracts/validation/operations/releases";
import { createSignedReleaseEnvelope } from "@repo/release-protocol/envelope";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ releaseId: string }>;
};

export async function GET(
  request: Request,
  routeContext: RouteContext,
): Promise<Response> {
  try {
    const { releaseId } = await routeContext.params;
    const parsed = parseDownloadReleaseRequest({ releaseId });

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

    const database = getDatabasePool();

    const context = await getCurrentSession(request);

    let unsignedRelease;

    if (context) {
      if (process.env.NODE_ENV === "production") {
        const decision = await checkRateLimit("release-download", [
          context.userId,
          parsed.value.releaseId,
        ]);

        if (!decision.allowed) return rateLimitResponse(decision);
      }

      unsignedRelease = await getPublishedReleaseForSession(
        database,
        context,
        parsed.value.releaseId,
      );
    } else {
      const apiKey = await authorizeReleaseDownloadApiKey(
        database,
        getBearerApiKeyCredential(request),
      );

      if (process.env.NODE_ENV === "production") {
        const decision = await checkRateLimit("release-download", [
          apiKey.projectId,
          apiKey.keyIdentifier,
        ]);

        if (!decision.allowed) return rateLimitResponse(decision);
      }

      unsignedRelease = await downloadReleaseWithAuthorizedApiKey(
        database,
        apiKey,
        parsed.value.releaseId,
      );
    }

    const signing = getReleaseSigningConfiguration();
    const signedRelease = createSignedReleaseEnvelope(unsignedRelease, {
      privateKey: signing.privateKey,
      keyId: signing.keyId,
    });

    return Response.json(signedRelease, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return mapApiError(error);
  }
}
