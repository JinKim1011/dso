import {
  createApiKeyRequest,
  revokeApiKeyRequest,
} from "@repo/contracts/fixtures/operation-contracts";
import {
  parseCreateApiKeyRequest,
  parseRevokeApiKeyRequest,
} from "@repo/contracts/validation/operations/api-keys";
import { describe, expect, it } from "vitest";

describe("RevokeApiKeyRequest and CreateApiKeyRequest operation parsers", () => {
  it("parses API-key requests", () => {
    expect(parseCreateApiKeyRequest(createApiKeyRequest)).toMatchObject({
      success: true,
    });
    expect(parseRevokeApiKeyRequest(revokeApiKeyRequest)).toMatchObject({
      success: true,
    });
  });

  it("rejects invalid API-key scopes and expiration dates", () => {
    expect(
      parseCreateApiKeyRequest({
        ...createApiKeyRequest,
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

  it("rejects an expiration date that is not in the future", () => {
    expect(
      parseCreateApiKeyRequest({
        ...createApiKeyRequest,
        expiresAt: "2020-01-01T00:00:00.000Z",
      }),
    ).toMatchObject({
      success: false,
      issues: [{ field: "expiresAt", code: "invalid-format" }],
    });
  });
});
