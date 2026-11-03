import { requireProjectAccess } from "@repo/application/authorization";
import { ResourceNotFoundError } from "@repo/application/errors";
import { AuthorizationContext } from "@repo/application/types";
import { PublishedReleaseResponse } from "@repo/contracts/operation";
import { findReleaseSnapshot } from "@repo/db/repositories/release-snapshots";
import { findReleaseById } from "@repo/db/repositories/releases";
import { Pool } from "pg";

export async function getPublishedRelease(
  database: Pool,
  context: AuthorizationContext,
  releaseId: string,
): Promise<PublishedReleaseResponse> {
  const release = await findReleaseById(database, releaseId);

  if (!release || release.status !== "published") {
    throw new ResourceNotFoundError();
  }

  await requireProjectAccess(database, context.userId, release.projectId);

  const snapshot = await findReleaseSnapshot(database, release.id);

  if (!snapshot) {
    throw new ResourceNotFoundError();
  }

  return {
    schemaVersion: 1,
    release,
    ...snapshot,
  };
}
