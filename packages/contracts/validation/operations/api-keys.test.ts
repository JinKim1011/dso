import {
  parseCreateApiKeyRequest,
  parseRevokeApiKeyRequest,
} from "@repo/contracts/validation/operations/api-keys";
import { describe, expect, it } from "vitest";

describe("RevokeApiKeyRequest and CreateApiKeyRequest operation parsers", () => {
  it("parses API-key requests", () => {
    expect(
      parseCreateApiKeyRequest({
        projectId: "project-1",
        expiresAt: "2026-11-27T10:00:00Z",
        scope: "release:read",
      }),
    ).toMatchObject({ success: true });
    expect(
      parseRevokeApiKeyRequest({ projectId: "project-1", apiKeyId: "key-1" }),
    ).toMatchObject({ success: true });
  });

  it("rejects invalid API-key scopes and expiration dates", () => {
    expect(
      parseCreateApiKeyRequest({
        projectId: "project-1",
        expiresAt: "not-a-date",
        scope: "write",
      }),
    ).toMatchObject({
      success: false,
      issues: [
        { field: "expiresAt", code: "invalid-format" },
        { field: "scope", code: "unsupported-value" },
      ],
    });
  });
});
