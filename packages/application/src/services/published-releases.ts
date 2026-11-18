import {
  ProjectAccessDeniedError,
  ResourceNotFoundError,
} from "@repo/application/errors";
import { requireProjectAccess } from "@repo/application/services/authorization";
import { loadPublishedRelease } from "@repo/application/services/published-release-loader";
import { AuthorizationContext } from "@repo/application/types";
import { PublishedReleaseResponse } from "@repo/contracts/operation";
import { Pool } from "pg";

export async function getPublishedReleaseForSession(
  database: Pool,
  context: AuthorizationContext,
  releaseId: string,
): Promise<PublishedReleaseResponse> {
  return loadPublishedRelease(database, releaseId, async (release) => {
    try {
      await requireProjectAccess(database, context.userId, release.projectId);
    } catch (error) {
      if (error instanceof ProjectAccessDeniedError) {
        throw new ResourceNotFoundError();
      }
      throw error;
    }
  });
}
