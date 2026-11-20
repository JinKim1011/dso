import { fetchSignedRelease } from "@repo/cli/api/release-client";
import { releaseCachePath } from "@repo/cli/cache/cache-path";
import { writeVerifiedReleaseCache } from "@repo/cli/cache/release-cache";
import {
  loadCliConfiguration,
  type CliConfiguration,
} from "@repo/cli/config/environment";
import { loadReleaseTrustFile } from "@repo/cli/config/trust-file";
import { parsePullArguments } from "@repo/cli/options/pull-options";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { parseSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import type { ReleasePublicKey } from "@repo/release-protocol/keys";
import { verifyRelease } from "@repo/release-protocol/verify";

export type PullDependencies = Readonly<{
  loadConfiguration: (overrides: {
    apiUrl?: string;
    trustFilePath?: string;
    cachePath?: string;
  }) => CliConfiguration;

  loadTrustFile: (filePath: string) => Promise<ReadonlyMap<string, ReleasePublicKey>>;

  fetchRelease: (
    releaseId: string,
    options: { apiBaseUrl: string; apiKey: string },
  ) => Promise<SignedPublishedReleaseResponse>;

  verify: (
    envelope: SignedPublishedReleaseResponse,
    trustedKeys: ReadonlyMap<string, ReleasePublicKey>,
  ) => boolean;

  writeCache: (
    filePath: string,
    envelope: SignedPublishedReleaseResponse,
  ) => Promise<void>;
}>;

const defaultDependencies: PullDependencies = {
  loadConfiguration: (overrides) => loadCliConfiguration(process.env, overrides),
  loadTrustFile: loadReleaseTrustFile,
  fetchRelease: fetchSignedRelease,
  verify: verifyRelease,
  writeCache: writeVerifiedReleaseCache,
};

export class ReleaseVerificationError extends Error {
  constructor() {
    super("The signed release could not be verified.");
    this.name = "ReleaseVerificationError";
  }
}

export async function runPull(
  args: readonly string[],
  dependencies: PullDependencies = defaultDependencies,
): Promise<string> {
  const options = parsePullArguments(args);

  const configuration = dependencies.loadConfiguration({
    apiUrl: options.apiUrl,
    trustFilePath: options.trustFile,
    cachePath: options.cacheDirectory,
  });

  const envelope = parseSignedReleaseEnvelope(
    await dependencies.fetchRelease(options.releaseId, {
      apiBaseUrl: configuration.apiBaseUrl,
      apiKey: configuration.apiKey,
    }),
  );

  const trustedKeys = await dependencies.loadTrustFile(configuration.trustFilePath);

  if (!dependencies.verify(envelope, trustedKeys)) {
    throw new ReleaseVerificationError();
  }

  const cacheFilePath = releaseCachePath(configuration.cachePath, options.releaseId);

  await dependencies.writeCache(cacheFilePath, envelope);

  return cacheFilePath;
}
