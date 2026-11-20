import { DomainValidationError, ResourceNotFoundError } from "@repo/application/errors";
import type { AuthorizationContext } from "@repo/application/types";
import type {
  PublishedReleaseResponse,
  PublishReleaseRequest,
} from "@repo/contracts/operation";
import type { Release } from "@repo/contracts/type";
import { insertAuditEvent } from "@repo/db/repositories/audit-events";
import { createReleaseSnapshot } from "@repo/db/repositories/release-snapshots";
import {
  findDraftReleaseForUpdate,
  updateReleasesStatus,
} from "@repo/db/repositories/releases";
import type { PoolClient } from "pg";
import { canonicalizeRelease } from "@repo/release-protocol/canonicalize";
import {
  assertResponseSize,
  ED25519_SIGNATURE_BASE64URL_LENGTH,
  MAX_RELEASE_KEY_ID_BYTES,
} from "@repo/release-protocol/limits";

function assertReleaseCanBeDownloaded(release: PublishedReleaseResponse): void {
  try {
    canonicalizeRelease(release);
    assertResponseSize({
      ...release,
      signature: {
        algorithm: "Ed25519",
        keyId: "k".repeat(MAX_RELEASE_KEY_ID_BYTES),
        value: "A".repeat(ED25519_SIGNATURE_BASE64URL_LENGTH),
      },
    });
  } catch (error) {
    if (error instanceof RangeError) {
      throw new DomainValidationError([
        {
          code: "release-too-large",
          message:
            "The published release exceeds the 5 MiB download size limit, including signature metadata.",
        },
      ]);
    }
    throw error;
  }
}

export async function publishRelease(
  client: PoolClient,
  context: AuthorizationContext,
  request: PublishReleaseRequest,
): Promise<Release> {
  const release = await findDraftReleaseForUpdate(
    client,
    request.releaseId,
    request.projectId,
  );

  if (!release) {
    throw new ResourceNotFoundError();
  }

  const publishedAt = new Date().toISOString();
  const snapshot = await createReleaseSnapshot(client, release.id, release.projectId);
  assertReleaseCanBeDownloaded({
    schemaVersion: 1,
    release: {
      ...release,
      status: "published",
      publishedAt,
    },
    ...snapshot,
  });

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
}
