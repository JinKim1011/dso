import { parseGenerateArguments } from "@repo/cli/options/generate-options";
import { describe, expect, it } from "vitest";

const releaseId = "00000000-0000-4000-8000-000000000001";

describe("generate options", () => {
  it("parses generate paths and force", () => {
    expect(
      parseGenerateArguments([
        "--release",
        releaseId,
        "--output=./consumer",
        "--trust-file",
        "./trust.json",
        "--cache-dir=./cache",
        "--force",
      ]),
    ).toEqual({
      releaseId,
      output: "./consumer",
      trustFile: "./trust.json",
      cacheDirectory: "./cache",
      force: true,
    });
  });

  it("accepts a positional release ID and defaults force to false", () => {
    expect(parseGenerateArguments([releaseId])).toEqual({
      releaseId,
      output: undefined,
      trustFile: undefined,
      cacheDirectory: undefined,
      force: false,
    });
  });

  it("requires a UUID release ID", () => {
    expect(() => parseGenerateArguments(["--release", "release-id"])).toThrow();
    expect(() => parseGenerateArguments([])).toThrow(
      "Usage: dso generate --release <release-id>",
    );
  });

  it.each(["--release", "--output", "--trust-file", "--cache-dir"])(
    "rejects duplicate %s options",
    (option) => {
      const args =
        option === "--release"
          ? ["--release", releaseId, "--release", releaseId]
          : ["--release", releaseId, option, "value", option, "other"];

      expect(() => parseGenerateArguments(args)).toThrow(
        `${option} may only be specified once`,
      );
    },
  );

  it("rejects duplicate force and unknown options", () => {
    expect(() =>
      parseGenerateArguments(["--release", releaseId, "--force", "--force"]),
    ).toThrow("--force may only be specified once");
    expect(() =>
      parseGenerateArguments(["--release", releaseId, "--api-key", "secret"]),
    ).toThrow("Unknown generate option: --api-key");
    expect(() =>
      parseGenerateArguments(["--release", releaseId, "--force=true"]),
    ).toThrow("Unknown generate option: --force=true");
  });

  it.each(["--release", "--output", "--trust-file", "--cache-dir"])(
    "requires a value for %s",
    (option) => {
      const args = option === "--release" ? [option] : ["--release", releaseId, option];

      expect(() => parseGenerateArguments(args)).toThrow(`${option} needs a value`);
    },
  );
});
