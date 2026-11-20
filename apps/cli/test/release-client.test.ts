import {
  ReleaseApiNetworkError,
  ReleaseApiResponseError,
  ReleaseApiTimeoutError,
} from "@repo/cli/api/errors";
import { fetchSignedRelease } from "@repo/cli/api/release-client";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { describe, expect, it, vi } from "vitest";

const apiKey = "dso_sensitive_api_key";

type TestFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function envelope(): SignedPublishedReleaseResponse {
  return {
    schemaVersion: 1,
    release: {
      id: "release-1",
      projectId: "project-1",
      version: "1",
      status: "published",
      createdAt: "2026-01-01T00:00:00.000Z",
      publishedAt: "2026-01-01T00:00:00.000Z",
    },
    tokenTypes: [],
    tokens: [],
    references: [],
    components: [],
    templates: [],
    signature: {
      algorithm: "Ed25519",
      keyId: "key-1",
      value: Buffer.alloc(64).toString("base64url"),
    },
  };
}

describe("release API client", () => {
  it("requests the release endpoint with bearer authentication", async () => {
    const signed = envelope();
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(signed), {
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchSignedRelease("release id", {
      apiBaseUrl: "https://api.example.test/base/",
      apiKey,
      fetch,
    });

    expect(result).toEqual(signed);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://api.example.test/base/api/releases/release%20id");
    expect(init.headers.authorization).toBe(`Bearer ${apiKey}`);
    expect(init.redirect).toBe("error");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([301, 302, 307, 308])("rejects redirect status %i", async (status) => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status, headers: { location: "/" } }));

    await expect(
      fetchSignedRelease("release-1", {
        apiBaseUrl: "https://api.example.test",
        apiKey,
        fetch,
      }),
    ).rejects.toBeInstanceOf(ReleaseApiResponseError);
  });

  it("times out an unresponsive request", async () => {
    const fetch = vi.fn<TestFetch>(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException()));
        }),
    );

    await expect(
      fetchSignedRelease("release-1", {
        apiBaseUrl: "https://api.example.test",
        apiKey,
        fetch,
        timeoutMs: 5,
      }),
    ).rejects.toBeInstanceOf(ReleaseApiTimeoutError);
  });

  it("times out while reading the response stream", async () => {
    const fetch = vi.fn<TestFetch>((_input, init) =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              init?.signal?.addEventListener("abort", () => {
                controller.error(new DOMException("aborted"));
              });
            },
          }),
          { headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(
      fetchSignedRelease("release-1", {
        apiBaseUrl: "https://api.example.test",
        apiKey,
        fetch,
        timeoutMs: 5,
      }),
    ).rejects.toBeInstanceOf(ReleaseApiTimeoutError);
  });

  it("maps network failures without exposing request details", async () => {
    const sensitiveBody = "server returned secret body";
    const fetch = vi
      .fn()
      .mockRejectedValue(new Error(`failed for ${apiKey}: ${sensitiveBody}`));

    let error: unknown;
    try {
      await fetchSignedRelease("release-1", {
        apiBaseUrl: "https://api.example.test",
        apiKey,
        fetch,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ReleaseApiNetworkError);
    expect(String(error)).not.toContain(apiKey);
    expect(String(error)).not.toContain(sensitiveBody);
  });

  it("does not include response body or API key in invalid response errors", async () => {
    const sensitiveBody = `invalid body for ${apiKey}`;
    const fetch = vi.fn().mockResolvedValue(
      new Response(sensitiveBody, {
        headers: { "content-type": "application/json" },
      }),
    );

    let error: unknown;
    try {
      await fetchSignedRelease("release-1", {
        apiBaseUrl: "https://api.example.test",
        apiKey,
        fetch,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ReleaseApiResponseError);
    expect(String(error)).not.toContain(apiKey);
    expect(String(error)).not.toContain(sensitiveBody);
  });
});
