import { describe, expect, it } from "vitest";
import { isTrustedMutationRequest } from "./csrf";

const origin = "https://workbench.example.test";
const env: NodeJS.ProcessEnv = { NODE_ENV: "test", DSO_WORKBENCH_ORIGIN: origin };

function request(headers: Record<string, string> = {}): Request {
  return new Request(`${origin}/api/test`, {
    method: "POST",
    headers: { origin, "x-dso-csrf": "1", ...headers },
  });
}

describe("CSRF policy", () => {
  it("accepts a trusted origin and custom header with or without Fetch Metadata", () => {
    expect(isTrustedMutationRequest(request(), env)).toBe(true);
    expect(isTrustedMutationRequest(request({ "sec-fetch-site": "same-origin" }), env)).toBe(
      true,
    );
  });

  it.each(["same-site", "cross-site", "none", "unexpected", ""])(
    "rejects Fetch Metadata other than same-origin: %s",
    (site) => {
      expect(isTrustedMutationRequest(request({ "sec-fetch-site": site }), env)).toBe(false);
    },
  );

  it("requires the exact custom header and rejects missing or untrusted origins", () => {
    const missingHeader = request();
    missingHeader.headers.delete("x-dso-csrf");
    const missingOrigin = request();
    missingOrigin.headers.delete("origin");

    expect(isTrustedMutationRequest(missingHeader, env)).toBe(false);
    expect(isTrustedMutationRequest(request({ "x-dso-csrf": "0" }), env)).toBe(false);
    expect(isTrustedMutationRequest(missingOrigin, env)).toBe(false);
    expect(isTrustedMutationRequest(request({ origin: "null" }), env)).toBe(false);
    expect(isTrustedMutationRequest(request({ origin: "https://evil.example.test" }), env)).toBe(
      false,
    );
  });

  it.each(["", "https://workbench.example.test/path", "not-a-url"])(
    "fails closed on invalid trusted origin configuration: %s",
    (configuredOrigin) => {
      expect(() =>
        isTrustedMutationRequest(request(), { ...env, DSO_WORKBENCH_ORIGIN: configuredOrigin }),
      ).toThrow();
    },
  );
});
