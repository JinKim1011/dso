import { apiKeyCredential } from "@repo/contracts/fixtures/operation-contracts";
import { describe, expect, it } from "vitest";
import { getBearerApiKeyCredential } from "./bearer-authentication";

function request(authorization?: string, cookie?: string): Request {
  const headers = new Headers();

  if (authorization !== undefined) {
    headers.set("authorization", authorization);
  }
  if (cookie !== undefined) {
    headers.set("cookie", cookie);
  }

  return new Request("https://workbench.example.test/api/releases/release-id", {
    headers,
  });
}

describe("getBearerApiKeyCredential", () => {
  it.each(["Bearer", "bearer", "BEARER"])(
    "accepts a case-insensitive %s scheme",
    (scheme) => {
      expect(getBearerApiKeyCredential(request(`${scheme} ${apiKeyCredential}`))).toBe(
        apiKeyCredential,
      );
    },
  );

  it.each([
    undefined,
    "",
    "Basic dXNlcjpwYXNzd29yZA==",
    "Bearer",
    "Bearer ",
    `Bearer ${apiKeyCredential} extra`,
    `Bearer ${apiKeyCredential}\tother`,
    "Bearer not-an-api-key",
  ])("rejects a missing or malformed header", (authorization) => {
    expect(() => getBearerApiKeyCredential(request(authorization))).toThrowError(
      expect.objectContaining({ code: "invalid-api-key-credential" }),
    );
  });

  it("allows horizontal whitespace between the scheme and credential", () => {
    expect(getBearerApiKeyCredential(request(`Bearer\t\t${apiKeyCredential}`))).toBe(
      apiKeyCredential,
    );
  });

  it("does not parse or expose a session cookie", () => {
    const incoming = request(
      `Bearer ${apiKeyCredential}`,
      "dso_session=sensitive-session",
    );

    expect(getBearerApiKeyCredential(incoming)).toBe(apiKeyCredential);
  });

  it("does not expose the Authorization header in the error", () => {
    const secretHeader = "Bearer dso_0011223344556677_sensitive-secret";

    try {
      getBearerApiKeyCredential(request(secretHeader));
      throw new Error("Expected the credential to be rejected.");
    } catch (error) {
      expect(error).toMatchObject({ code: "invalid-api-key-credential" });
      expect(JSON.stringify(error)).not.toContain(secretHeader);
      expect((error as Error).message).not.toContain(secretHeader);
      expect((error as Error).message).not.toContain("sensitive-secret");
    }
  });
});
