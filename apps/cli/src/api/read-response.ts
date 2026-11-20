import { ReleaseApiError, ReleaseApiResponseError } from "@repo/cli/api/errors";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { parseSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { MAX_RELEASE_RESPONSE_BYTES } from "@repo/release-protocol/limits";

function isJsonContentType(value: string | null): boolean {
  const mediaType = value?.split(";", 1)[0]?.trim().toLowerCase();

  return mediaType === "application/json";
}

async function readLimitedBody(response: Response): Promise<Uint8Array> {
  const contentLength = response.headers.get("content-length");

  if (
    contentLength !== null &&
    (!/^\d+$/u.test(contentLength) || Number(contentLength) > MAX_RELEASE_RESPONSE_BYTES)
  ) {
    await response.body?.cancel();

    throw new ReleaseApiResponseError();
  }

  if (!response.body) {
    throw new ReleaseApiResponseError();
  }

  const reader = response.body.getReader();

  const chunks: Uint8Array[] = [];

  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      if (!(value instanceof Uint8Array)) {
        throw new ReleaseApiResponseError();
      }

      byteLength += value.byteLength;

      if (byteLength > MAX_RELEASE_RESPONSE_BYTES) {
        await reader.cancel();

        throw new ReleaseApiResponseError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(byteLength);

  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);

    offset += chunk.byteLength;
  }

  return body;
}

export async function readReleaseResponse(
  response: Response,
): Promise<SignedPublishedReleaseResponse> {
  if (response.status < 200 || response.status >= 300) {
    await response.body?.cancel();

    throw new ReleaseApiError(response.status);
  }

  if (!isJsonContentType(response.headers.get("content-type"))) {
    await response.body?.cancel();

    throw new ReleaseApiResponseError();
  }

  const bytes = await readLimitedBody(response);

  let input: unknown;

  try {
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    input = JSON.parse(json);
  } catch {
    throw new ReleaseApiResponseError();
  }

  try {
    return parseSignedReleaseEnvelope(input);
  } catch {
    throw new ReleaseApiResponseError();
  }
}
