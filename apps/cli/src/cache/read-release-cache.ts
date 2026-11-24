import { releaseCachePath, requireReleaseId } from "@repo/cli/cache/cache-path";
import { loadReleaseTrustFile } from "@repo/cli/config/trust-file";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { parseSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import type { ReleasePublicKey } from "@repo/release-protocol/keys";
import { MAX_RELEASE_RESPONSE_BYTES } from "@repo/release-protocol/limits";
import { verifyRelease } from "@repo/release-protocol/verify";
import { constants } from "node:fs";
import { open } from "node:fs/promises";

const MAX_CACHE_FILE_BYTES = MAX_RELEASE_RESPONSE_BYTES + 1;

export class ReleaseCacheReadError extends Error {
  constructor() {
    super("The verified release cache could not be read.");
    this.name = "ReleaseCacheReadError";
  }
}

export class ReleaseCacheVerificationError extends Error {
  constructor() {
    super("The cached release could not be verified.");
    this.name = "ReleaseCacheVerificationError";
  }
}

type ReadReleaseCacheOptions = Readonly<{
  cacheDirectory: string;
  releaseId: string;
  trustFilePath: string;
}>;

type ReadReleaseCacheDependencies = Readonly<{
  loadTrustFile: (filePath: string) => Promise<ReadonlyMap<string, ReleasePublicKey>>;
  verify: (
    envelope: SignedPublishedReleaseResponse,
    trustedKeys: ReadonlyMap<string, ReleasePublicKey>,
  ) => boolean;
}>;

const defaultDependencies: ReadReleaseCacheDependencies = {
  loadTrustFile: loadReleaseTrustFile,
  verify: verifyRelease,
};

async function readBoundedUtf8(filePath: string): Promise<string> {
  let fileHandle: Awaited<ReturnType<typeof open>> | undefined;

  try {
    fileHandle = await open(filePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const stat = await fileHandle.stat();

    if (!stat.isFile() || stat.size > MAX_CACHE_FILE_BYTES) {
      throw new ReleaseCacheReadError();
    }

    const chunks: Buffer[] = [];

    let byteLength = 0;

    while (byteLength <= MAX_CACHE_FILE_BYTES) {
      const remaining = MAX_CACHE_FILE_BYTES + 1 - byteLength;
      const buffer = Buffer.allocUnsafe(Math.min(64 * 1024, remaining));
      const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, null);

      if (bytesRead === 0) break;

      byteLength += bytesRead;

      chunks.push(buffer.subarray(0, bytesRead));
    }

    if (byteLength > MAX_CACHE_FILE_BYTES) {
      throw new ReleaseCacheReadError();
    }

    return new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks, byteLength),
    );
  } catch (error) {
    if (error instanceof ReleaseCacheReadError) throw error;

    throw new ReleaseCacheReadError();
  } finally {
    await fileHandle?.close();
  }
}

export async function readVerifiedReleaseCache(
  options: ReadReleaseCacheOptions,
  dependencies: ReadReleaseCacheDependencies = defaultDependencies,
): Promise<SignedPublishedReleaseResponse> {
  const releaseId = requireReleaseId(options.releaseId);
  const cacheFilePath = releaseCachePath(options.cacheDirectory, releaseId);
  const source = await readBoundedUtf8(cacheFilePath);

  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    throw new ReleaseCacheReadError();
  }

  let envelope: SignedPublishedReleaseResponse;
  try {
    envelope = parseSignedReleaseEnvelope(value);
  } catch {
    throw new ReleaseCacheVerificationError();
  }

  if (envelope.release.id.toLowerCase() !== releaseId.toLowerCase()) {
    throw new ReleaseCacheVerificationError();
  }

  const trustedKeys = await dependencies.loadTrustFile(options.trustFilePath);

  if (!dependencies.verify(envelope, trustedKeys)) {
    throw new ReleaseCacheVerificationError();
  }

  return envelope;
}
