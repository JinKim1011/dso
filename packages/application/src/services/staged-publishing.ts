import { DomainValidationError } from "@repo/application/errors";
import {
  requiredProjectRole,
  requireProjectAccess,
} from "@repo/application/services/authorization";
import { withProjectTransaction } from "@repo/application/services/project-transaction";
import { publishRelease } from "@repo/application/services/releases";
import { saveStagedChanges } from "@repo/application/services/staged-changes";
import type { AuthorizationContext } from "@repo/application/types";
import type {
  PublishStagedChangesRequest,
  PublishStagedChangesResult,
} from "@repo/contracts/operation";
import { insertRelease, nextReleaseVersion } from "@repo/db/repositories/releases";
import type { Pool } from "pg";

export async function publishStagedChanges(
  database: Pool,
  context: AuthorizationContext,
  request: PublishStagedChangesRequest,
): Promise<PublishStagedChangesResult> {
  const projectId = request.projectId.toLowerCase();

  const membership = await requireProjectAccess(database, context.userId, projectId);

  requiredProjectRole(membership, projectId, "publisher");

  return withProjectTransaction(database, projectId, async (client) => {
    const existing = await resolvePublishRequest(client, context.userId, request);
    if (existing) return existing;

    const saved = await saveStagedChanges(client, context, request);

    if (saved.changedTokenIds.length === 0) {
      throw new DomainValidationError([
        { code: "no-changes", message: "There are no changes to publish." },
      ]);
    }

    const release = await insertRelease(client, {
      id: crypto.randomUUID(),
      projectId,
      version: await nextReleaseVersion(client, projectId),
      status: "draft",
      createdAt: new Date().toISOString(),
      publishedAt: null,
    });

    const published = await publishRelease(client, context, {
      projectId,
      releaseId: release.id,
    });

    return {
      release: published,
      tokens: saved.tokens,
      references: saved.references,
    };
  });
}
