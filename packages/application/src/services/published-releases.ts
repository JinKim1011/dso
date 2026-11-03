import { ResourceNotFoundError } from "@repo/application/errors";
import { AuthorizationContext } from "@repo/application/types";
import { PublishedReleaseResponse } from "@repo/contracts/operation";
import { listComponentsByProjectId } from "@repo/db/repositories/components";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { findReleaseById } from "@repo/db/repositories/releases";
import { listDocumentTemplatesByProjectId } from "@repo/db/repositories/templates";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";
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

  const [tokenTypes, tokens, references, components, templates] = await Promise.all([
    listTokenTypesByProjectId(database, release.projectId),
    listTokensByProjectId(database, release.projectId),
    listTokenReferencesByProjectId(database, release.projectId),
    listComponentsByProjectId(database, release.projectId),
    listDocumentTemplatesByProjectId(database, release.projectId),
  ]);

  return {
    schemaVersion: 1,
    release,
    tokenTypes,
    tokens,
    references,
    components,
    templates,
  };
}
