import { runCli } from "@repo/cli/cli";
import { CliUsageError } from "@repo/cli/errors";
import { generateKeyPairSync } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileAsync = promisify(execFile);
const builtCli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const directories: string[] = [];

function io() {
  return {
    stdout: { write: vi.fn() },
    stderr: { write: vi.fn() },
  };
}

function dependencies() {
  return {
    loadConfiguration: () => ({
      apiKey: "dso_test_secret",
      apiBaseUrl: "https://api.example.test",
      trustFilePath: "/test/trust.json",
      cachePath: "/test/cache",
    }),
    loadTrustFile: vi.fn().mockResolvedValue(new Map()),
  };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("dso CLI", () => {
  it("dispatches pull", async () => {
    const streams = io();

    expect(await runCli(["pull", "release-id"], streams, dependencies())).toBe(0);
    expect(streams.stdout.write).toHaveBeenCalledWith("Pull command recognized.\n");
  });

  it("fails an unknown command", async () => {
    const streams = io();

    expect(await runCli(["unknown"], streams)).toBe(2);
    expect(streams.stderr.write).toHaveBeenCalledWith("Unknown command: unknown\n");
  });

  it("requires a release identifier for pull", async () => {
    await expect(runCli(["pull"], io(), dependencies())).rejects.toBeInstanceOf(
      CliUsageError,
    );
  });

  it("provides help without an API key argument option", async () => {
    const streams = io();

    expect(await runCli(["--help"], streams)).toBe(0);
    const output = String(vi.mocked(streams.stdout.write).mock.calls[0]?.[0]);
    expect(output).toContain("pull <release-id>");
    expect(output).toContain("DSO_API_KEY");
    expect(output).not.toMatch(/--api-key|--credential/u);
  });

  it("supports version and command help", async () => {
    const streams = io();

    expect(await runCli(["--version"], streams)).toBe(0);
    expect(await runCli(["pull", "--help"], streams, dependencies())).toBe(0);
  });

  it("runs the built dso entry point with pull", async () => {
    const directory = await mkdtemp(join(tmpdir(), "dso-cli-"));
    directories.push(directory);
    const trustFile = join(directory, "trust.json");
    const publicKey = generateKeyPairSync("ed25519")
      .publicKey.export({ format: "pem", type: "spki" })
      .toString();
    await writeFile(trustFile, JSON.stringify({ keys: { "release-key-1": publicKey } }));

    const result = await execFileAsync(
      process.execPath,
      [builtCli, "pull", "release-id"],
      {
        env: {
          ...process.env,
          DSO_API_KEY: "dso_test_secret",
          DSO_API_URL: "https://api.example.test",
          DSO_RELEASE_TRUST_FILE: trustFile,
        },
      },
    );

    expect(result.stdout).toContain("Pull command recognized.");
    expect(result.stderr).toBe("");
  });
});
