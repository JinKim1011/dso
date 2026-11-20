import {
  ReleaseApiError,
  ReleaseApiNetworkError,
  ReleaseApiResponseError,
  ReleaseApiTimeoutError,
} from "@repo/cli/api/errors";
import { readReleaseResponse } from "@repo/cli/api/read-response";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";

const DEFAULT_TIMEOUT_MS = 15_000;

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type ReleaseClientOptions = Readonly<{
  apiBaseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetch?: Fetch;
}>;

function createReleaseUrl(apiBaseUrl: string, releaseId: string): string {
  const base = new URL(apiBaseUrl);
  const basePath = base.pathname.replace(/\/+$/u, "");

  base.pathname = `${basePath}/api/releases/${encodeURIComponent(releaseId)}`;

  return base.href;
}

export async function fetchSignedRelease(
  releaseId: string,
  options: ReleaseClientOptions,
): Promise<SignedPublishedReleaseResponse> {
  const fetchImplementation = options.fetch ?? globalThis.fetch;

  const controller = new AbortController();

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetchImplementation(
      createReleaseUrl(options.apiBaseUrl, releaseId),
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${options.apiKey}`,
        },
        redirect: "error",
        signal: controller.signal,
      },
    );

    if (response.redirected || (response.status >= 300 && response.status < 400)) {
      await response.body?.cancel();

      throw new ReleaseApiResponseError();
    }

    return await readReleaseResponse(response);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ReleaseApiTimeoutError();
    }

    if (
      error instanceof ReleaseApiError ||
      error instanceof ReleaseApiResponseError ||
      error instanceof ReleaseApiNetworkError ||
      error instanceof ReleaseApiTimeoutError
    ) {
      throw error;
    }

    throw new ReleaseApiNetworkError();
  } finally {
    clearTimeout(timer);
  }
}
