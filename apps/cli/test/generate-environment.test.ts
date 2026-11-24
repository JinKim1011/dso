import { loadGenerateConfiguration } from "@repo/cli/config/generate-environment";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const home = join(process.cwd(), "test-home");

describe("generate configuration", () => {
  it("resolves output, trust, and cache paths from cwd without API settings", () => {
    expect(
      loadGenerateConfiguration(
        { DSO_RELEASE_TRUST_FILE: "./config/trust.json" },
        {
          cwd: "/workspace/consumer",
          home,
          outputPath: "./generated",
          cachePath: "./.dso/cache",
        },
      ),
    ).toEqual({
      outputPath: "/workspace/consumer/generated",
      trustFilePath: "/workspace/consumer/config/trust.json",
      cachePath: "/workspace/consumer/.dso/cache",
    });
  });

  it("defaults output to cwd and uses pull cache/trust defaults", () => {
    expect(loadGenerateConfiguration({}, { cwd: "/workspace", home })).toEqual({
      outputPath: "/workspace",
      trustFilePath:
        process.platform === "darwin"
          ? join(home, "Library", "Application Support", "dso", "trust.json")
          : join(home, ".config", "dso", "trust.json"),
      cachePath:
        process.platform === "darwin"
          ? join(home, "Library", "Caches", "dso")
          : join(home, ".cache", "dso"),
    });
  });

  it("keeps generate independent of API credentials and URLs", () => {
    expect(() =>
      loadGenerateConfiguration({
        DSO_API_KEY: "invalid credential",
        DSO_API_URL: "not-a-url",
      }),
    ).not.toThrow();
  });
});
