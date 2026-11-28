import { PublishRequestConflictError } from "@repo/application/errors";
import type {
  PublishStagedChangesRequest,
  PublishStagedChangesResult,
} from "@repo/contracts/operation";
import { isRecord } from "@repo/contracts/validation/operations/common";
import {
  findPublishRequest,
  insertPublishRequest,
} from "@repo/db/repositories/publish-requests";
import { createHash } from "node:crypto";
import type { PoolClient } from "pg";

function hashPublishRequest(request: PublishStagedChangesRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        projectId: request.projectId.toLowerCase(),
        changes: request.changes,
      }),
    )
    .digest("hex");
}

export async function resolvePublishRequest(
  client: PoolClient,
  userId: string,
  request: PublishStagedChangesRequest,
): Promise<PublishStagedChangesResult | null> {
  const projectId = request.projectId.toLowerCase();
  const existing = await findPublishRequest(client, projectId, userId, request.requestId);

  if (!existing) return null;
  if (existing.requestHash !== hashPublishRequest(request)) {
    throw new PublishRequestConflictError();
  }

  const response = existing.response;

  if (
    !isRecord(response) ||
    !isRecord(response.release) ||
    response.release.id !== existing.releaseId ||
    response.release.projectId?.toLowerCase() !== projectId ||
    response.release.status !== "published" ||
    !Array.isArray(response.tokens) ||
    !response.tokens.every(
      (token) => isRecord(token) && token.projectId?.toLowerCase() === projectId,
    ) ||
    !Array.isArray(response.references) ||
    !response.references.every(
      (reference) =>
        isRecord(reference) && reference.projectId?.toLowerCase() === projectId,
    )
  ) {
    throw new Error("Stored publish response is invalid.");
  }

  return response;
}

export async function recordPublishRequest(
  client: PoolClient,
  userId: string,
  request: PublishStagedChangesRequest,
  response: PublishStagedChangesResult,
): Promise<void> {
  const projectId = request.projectId.toLowerCase();

  await insertPublishRequest(client, {
    projectId,
    userId,
    requestId: request.requestId,
    requestHash: hashPublishRequest(request),
    releaseId: response.release.id,
    response,
  });
}
