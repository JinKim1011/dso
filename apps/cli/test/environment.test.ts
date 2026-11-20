import { loadCliConfiguration } from "@repo/cli/config/environment";
import { CliConfigurationError } from "@repo/cli/errors";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const home = join(process.cwd(), "test-home");

describe("CLI configuration", () => {
  it("loads normalized API, trust, and cache settings", () => {
    const configuration = loadCliConfiguration(
      {
        DSO_API_KEY: "dso_test_secret",
        DSO_API_URL: "https://api.example.test/",
        DSO_RELEASE_TRUST_FILE: "./trust.json",
      },
      { cwd: "/workspace", home },
    );

    expect(configuration).toEqual({
      apiKey: "dso_test_secret",
      apiBaseUrl: "https://api.example.test",
      trustFilePath: "/workspace/trust.json",
      cachePath:
        process.platform === "darwin"
          ? join(home, "Library", "Caches", "dso")
          : join(home, ".cache", "dso"),
    });
  });

  it("requires DSO_API_KEY", () => {
    expect(() =>
      loadCliConfiguration({ DSO_API_URL: "https://api.example.test" }),
    ).toThrow(CliConfigurationError);
  });

  it("does not include credentials in configuration errors", () => {
    const credential = "dso_sensitive_secret";
    try {
      loadCliConfiguration({
        DSO_API_KEY: credential,
        DSO_API_URL: "http://remote.example.test",
      });
    } catch (error) {
      expect(String(error)).not.toContain(credential);
    }
  });

  it("requires HTTPS in production, including for loopback hosts", () => {
    expect(() =>
      loadCliConfiguration({
        NODE_ENV: "production",
        DSO_API_KEY: "dso_test_secret",
        DSO_API_URL: "http://localhost:3000",
      }),
    ).toThrow(CliConfigurationError);
  });
});
