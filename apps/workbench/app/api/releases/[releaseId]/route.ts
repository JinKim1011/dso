import { mapApiError } from "@/server/api-error";
import { getBearerApiKeyCredential } from "@/server/bearer-authentication";
import { getCurrentSession } from "@/server/current-session";
import { getReleaseSigningConfiguration } from "@/server/config";
import { getDatabasePool } from "@/server/database";
import { downloadReleaseWithApiKey } from "@repo/application/services/download-release";
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
    const unsignedRelease = context
      ? await getPublishedReleaseForSession(database, context, parsed.value.releaseId)
      : await downloadReleaseWithApiKey(
          database,
          getBearerApiKeyCredential(request),
          parsed.value.releaseId,
        );

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
