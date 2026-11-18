import { mapApiError } from "@/server/api-error";
import { getBearerApiKeyCredential } from "@/server/bearer-authentication";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { downloadReleaseWithApiKey } from "@repo/application/services/download-release";
import { getPublishedReleaseForSession } from "@repo/application/services/published-releases";
import { parseDownloadReleaseRequest } from "@repo/contracts/validation/operations/releases";

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
    const result = context
      ? await getPublishedReleaseForSession(database, context, parsed.value.releaseId)
      : await downloadReleaseWithApiKey(
          database,
          getBearerApiKeyCredential(request),
          parsed.value.releaseId,
        );

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return mapApiError(error);
  }
}
