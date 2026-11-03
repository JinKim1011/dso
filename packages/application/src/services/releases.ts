import { requiredProjectRole } from "@repo/application/authorization";
import {
  ProjectAccessDeniedError,
  ResourceNotFoundError,
} from "@repo/application/errors";
import { AuthorizationContext } from "@repo/application/types";
import type { PublishReleaseRequest } from "@repo/contracts/operation";
import type { Release } from "@repo/contracts/type";
import { insertAuditEvent } from "@repo/db/repositories/audit-events";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
import { createReleaseSnapshot } from "@repo/db/repositories/release-snapshots";
import {
  findDraftReleaseForUpdate,
  updateReleasesStatus,
} from "@repo/db/repositories/releases";
import { withTransaction } from "@repo/db/transaction";
import { Pool } from "pg";

export async function publishRelease(
  database: Pool,
  context: AuthorizationContext,
  request: PublishReleaseRequest,
): Promise<Release> {
  const membership = await requireProjectAccess(
    database,
    context.userId,
    request.projectId,
  );

  if (!membership) {
    throw new ProjectAccessDeniedError();
  }

  requiredProjectRole(membership, request.projectId, "publisher");

  return withTransaction(database, async (client) => {
    const release = await findDraftReleaseForUpdate(
      client,
      request.releaseId,
      request.projectId,
    );

    if (!release) {
      throw new ResourceNotFoundError();
    }

    await createReleaseSnapshot(client, release.id, release.projectId);

    const publishedAt = new Date().toISOString();

    const published = await updateReleasesStatus(
      client,
      release.id,
      request.projectId,
      "published",
      publishedAt,
    );

    if (!published) {
      throw new ResourceNotFoundError();
    }

    await insertAuditEvent(client, {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: release.projectId,
      action: "release.published",
      resourceType: "release",
      resourceId: release.id,
      createdAt: publishedAt,
    });

    return published;
  });
}
