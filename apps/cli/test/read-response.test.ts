import { ReleaseApiError, ReleaseApiResponseError } from "@repo/cli/api/errors";
import { readReleaseResponse } from "@repo/cli/api/read-response";
import { MAX_RELEASE_RESPONSE_BYTES } from "@repo/release-protocol/limits";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { describe, expect, it } from "vitest";

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

function jsonResponse(
  value: unknown,
  options: { contentType?: string; status?: number } = {},
): Response {
  return new Response(JSON.stringify(value), {
    status: options.status ?? 200,
    headers: { "content-type": options.contentType ?? "application/json" },
  });
}

describe("readReleaseResponse", () => {
  it("returns a structurally valid signed envelope", async () => {
    const signed = envelope();

    await expect(readReleaseResponse(jsonResponse(signed))).resolves.toEqual(signed);
  });

  it.each([401, 403, 404, 500])(
    "rejects HTTP %i without reading the body",
    async (status) => {
      const body = "sensitive response body";
      const response = new Response(body, { status });

      await expect(readReleaseResponse(response)).rejects.toMatchObject({
        status,
      });
    },
  );

  it("rejects malformed JSON and invalid UTF-8", async () => {
    await expect(
      readReleaseResponse(
        new Response("{invalid", {
          headers: { "content-type": "application/json" },
        }),
      ),
    ).rejects.toBeInstanceOf(ReleaseApiResponseError);

    await expect(
      readReleaseResponse(
        new Response(new Uint8Array([0xc3, 0x28]), {
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
      ),
    ).rejects.toBeInstanceOf(ReleaseApiResponseError);
  });

  it("rejects a wrong content type", async () => {
    await expect(
      readReleaseResponse(jsonResponse(envelope(), { contentType: "text/plain" })),
    ).rejects.toBeInstanceOf(ReleaseApiResponseError);
  });

  it("rejects an oversized streaming body", async () => {
    const size = MAX_RELEASE_RESPONSE_BYTES + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(size));
        controller.close();
      },
    });
    const response = new Response(stream, {
      headers: { "content-type": "application/json" },
    });

    await expect(readReleaseResponse(response)).rejects.toBeInstanceOf(
      ReleaseApiResponseError,
    );
  });

  it("rejects malformed signed envelopes", async () => {
    const invalid = { ...envelope(), schemaVersion: 2 };

    await expect(readReleaseResponse(jsonResponse(invalid))).rejects.toBeInstanceOf(
      ReleaseApiResponseError,
    );
  });
});
