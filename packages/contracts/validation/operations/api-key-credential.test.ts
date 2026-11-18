import { apiKeyCredential } from "@repo/contracts/fixtures/operation-contracts";
import { parseApiKeyCredential } from "@repo/contracts/validation/operations/api-key-credential";
import { describe, expect, it } from "vitest";

describe("parseApiKeyCredential", () => {
  it("parses the identifier and secret from a combined credential", () => {
    expect(parseApiKeyCredential(apiKeyCredential)).toEqual({
      success: true,
      value: {
        keyIdentifier: "0011223344556677",
        secret: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      },
    });
  });

  it("accepts base64url underscores inside the secret", () => {
    const credential = "dso_0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_A";

    expect(parseApiKeyCredential(credential)).toMatchObject({
      success: true,
      value: {
        keyIdentifier: "0011223344556677",
        secret: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_A",
      },
    });
  });

  it.each([null, undefined, 123])("rejects a non-string credential: %s", (credential) => {
    expect(parseApiKeyCredential(credential)).toMatchObject({
      success: false,
      issues: [{ field: "credential", code: "invalid-type" }],
    });
  });

  it.each([
    "key_0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "dso-0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  ])("rejects an unsupported prefix: %s", (credential) => {
    expect(parseApiKeyCredential(credential)).toMatchObject({
      success: false,
      issues: [{ field: "credential", code: "unsupported-value" }],
    });
  });

  it.each([
    "dso_001122334455667_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "dso_001122334455667g_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "dso_0011223344556677_",
    "dso__AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "dso_0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_extra",
    "dso_0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "dso_0011223344556677_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.",
  ])("rejects a malformed credential: %s", (credential) => {
    expect(parseApiKeyCredential(credential)).toMatchObject({
      success: false,
      issues: [{ field: "credential", code: "invalid-format" }],
    });
  });

  it("rejects an empty credential", () => {
    expect(parseApiKeyCredential("")).toMatchObject({
      success: false,
      issues: [{ field: "credential", code: "empty" }],
    });
  });
});
