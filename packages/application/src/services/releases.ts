import { requiredProjectRole } from "@repo/application/authorization";
import { ResourceNotFoundError } from "@repo/application/errors";
import { AuthorizationContext } from "@repo/application/types";
import type { PublishReleaseRequest } from "@repo/contracts/operation";
import type { Release } from "@repo/contracts/type";
import { insertAuditEvent } from "@repo/db/repositories/audit-events";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
import { findReleaseById, updateReleasesStatus } from "@repo/db/repositories/releases";
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

  requiredProjectRole(membership, request.projectId, "publisher");

  const release = await findReleaseById(database, request.releaseId);

  if (!release || release.projectId !== request.projectId) {
    throw new ResourceNotFoundError();
  }

  return withTransaction(database, async (client) => {
    const published = await updateReleasesStatus(
      client,
      release.id,
      request.projectId,
      "published",
      new Date().toISOString(),
    );

    if (!published) {
      throw new ResourceNotFoundError();
    }

    await insertAuditEvent(client, {
      id: crypto.randomUUID(),
      userId: context.userId,
      projectId: request.projectId,
      action: "release.published",
      resourceType: "release",
      resourceId: published.id,
      createdAt: new Date().toISOString(),
    });

    return published;
  });
}
