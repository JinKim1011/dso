import {
  ApiKeyScopeDeniedError,
  InvalidApiKeyCredentialError,
  ResourceNotFoundError,
} from "@repo/application/errors";
import {
  parseApiKeyCredential,
  verifyApiKeySecret,
} from "@repo/application/security/api-key-credentials";
import { loadPublishedRelease } from "@repo/application/services/published-release-loader";
import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { findActiveApiKeyByIdentifier } from "@repo/db/repositories/api-keys";
import type { Pool } from "pg";

type AuthorizedReleaseApiKey = Readonly<{
  keyIdentifier: string;
  projectId: string;
}>;

export async function authorizeReleaseDownloadApiKey(
  database: Pool,
  credential: unknown,
): Promise<AuthorizedReleaseApiKey> {
  const parsedCredential = parseApiKeyCredential(credential);

  if (!parsedCredential.success) {
    throw new InvalidApiKeyCredentialError();
  }

  const apiKey = await findActiveApiKeyByIdentifier(
    database,
    parsedCredential.value.keyIdentifier,
  );

  if (!apiKey || !verifyApiKeySecret(apiKey.keyHash, parsedCredential.value.secret)) {
    throw new InvalidApiKeyCredentialError();
  }

  if (apiKey.scope !== "release:read") {
    throw new ApiKeyScopeDeniedError();
  }

  return {
    keyIdentifier: apiKey.keyIdentifier,
    projectId: apiKey.projectId,
  };
}

export async function downloadReleaseWithAuthorizedApiKey(
  database: Pool,
  apiKey: AuthorizedReleaseApiKey,
  releaseId: string,
): Promise<PublishedReleaseResponse> {
  return loadPublishedRelease(database, releaseId, (release) => {
    if (release.projectId !== apiKey.projectId) {
      throw new ResourceNotFoundError();
    }
  });
}

export async function downloadReleaseWithApiKey(
  database: Pool,
  credential: unknown,
  releaseId: string,
): Promise<PublishedReleaseResponse> {
  const apiKey = await authorizeReleaseDownloadApiKey(database, credential);

  return downloadReleaseWithAuthorizedApiKey(database, apiKey, releaseId);
}
