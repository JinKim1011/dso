import { requiredProjectRole } from "@repo/application/authorization";
import { ResourceNotFoundError } from "@repo/application/errors";
import { AuthorizationContext } from "@repo/application/types";
import {
  PublishReleaseRequest,
  PublishedReleaseResponse,
} from "@repo/contracts/operation";
import { Release } from "@repo/contracts/type";
import { listComponentsByProjectId } from "@repo/db/repositories/components";
import { requireProjectAccess } from "@repo/db/repositories/memberships";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { findReleaseById, updateReleasesStatus } from "@repo/db/repositories/releases";
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

  await requireProjectAccess(database, context, release.projectId);

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

export async function publishRelease(
  database: Pool,
  context: AuthorizationContext,
  request: PublishReleaseRequest,
): Promise<Release> {
  const membership = await requireProjectAccess(database, context, request.projectId);

  requiredProjectRole(membership, request.projectId, "publisher");

  const release = await findReleaseById(database, request.releaseId);

  if (!release || release.projectId !== request.projectId) {
    throw new ResourceNotFoundError();
  }

  const published = await updateReleasesStatus(
    database,
    release.id,
    request.projectId,
    "published",
    new Date().toISOString(),
  );

  if (!published) {
    throw new ResourceNotFoundError();
  }

  return published;
}
