import { hashApiKey } from "@repo/application/security/api-keys";
import {
  formatApiKeyCredential,
  parseApiKeyCredential,
  verifyApiKeySecret,
} from "@repo/application/security/api-key-credentials";
import {
  apiKeyCredential,
  apiKeyKeyIdentifier,
  apiKeySecret,
} from "@repo/contracts/fixtures/operation-contracts";
import { describe, expect, it } from "vitest";

describe("API-key credentials", () => {
  it("parses a valid combined credential", () => {
    expect(parseApiKeyCredential(apiKeyCredential)).toEqual({
      success: true,
      value: {
        keyIdentifier: apiKeyKeyIdentifier,
        secret: apiKeySecret,
      },
    });
  });

  it("rejects a malformed credential", () => {
    expect(parseApiKeyCredential("dso_bad_credential")).toMatchObject({
      success: false,
    });
  });

  it("formats a credential that can be parsed back into its parts", () => {
    const credential = formatApiKeyCredential(apiKeyKeyIdentifier, apiKeySecret);

    expect(credential).toBe(apiKeyCredential);
    expect(parseApiKeyCredential(credential)).toEqual({
      success: true,
      value: {
        keyIdentifier: apiKeyKeyIdentifier,
        secret: apiKeySecret,
      },
    });
  });

  it("verifies the correct secret", () => {
    expect(verifyApiKeySecret(hashApiKey(apiKeySecret), apiKeySecret)).toBe(true);
  });

  it("rejects an incorrect secret", () => {
    expect(verifyApiKeySecret(hashApiKey(apiKeySecret), "wrong-secret")).toBe(false);
  });

  it.each(["", "not-a-hash", "00", "z".repeat(64)])(
    "returns false for a malformed stored hash: %s",
    (storedHash) => {
      expect(() => verifyApiKeySecret(storedHash, apiKeySecret)).not.toThrow();
      expect(verifyApiKeySecret(storedHash, apiKeySecret)).toBe(false);
    },
  );
});
