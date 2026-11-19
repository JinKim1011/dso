import { ResourceNotFoundError } from "@repo/application/errors";
import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import type { Release } from "@repo/contracts/type";
import { findReleaseSnapshot } from "@repo/db/repositories/release-snapshots";
import { findReleaseById } from "@repo/db/repositories/releases";
import { Pool } from "pg";

type AuthorizeRelease = (release: Release) => void | Promise<void>;

export async function loadPublishedRelease(
  database: Pool,
  releaseId: string,
  authorize: AuthorizeRelease,
): Promise<PublishedReleaseResponse> {
  const release = await findReleaseById(database, releaseId);

  if (!release || release.status !== "published") {
    throw new ResourceNotFoundError();
  }

  await authorize(release);

  const snapshot = await findReleaseSnapshot(database, release.id);

  if (!snapshot) {
    throw new ResourceNotFoundError();
  }

  return {
    schemaVersion: 1,
    release,
    tokenTypes: snapshot.tokenTypes,
    tokens: snapshot.tokens,
    references: snapshot.references,
    components: snapshot.components,
    templates: snapshot.templates,
  };
}
