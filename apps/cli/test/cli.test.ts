import { runCli } from "@repo/cli/cli";
import { CliUsageError } from "@repo/cli/errors";
import { execFile } from "node:child_process";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it, vi } from "vitest";

const execFileAsync = promisify(execFile);
const builtCli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

function io() {
  return {
    stdout: { write: vi.fn() },
    stderr: { write: vi.fn() },
  };
}

function dependencies() {
  return {
    runPull: vi.fn().mockResolvedValue("/test/cache/release.json"),
    runGenerate: vi.fn().mockResolvedValue("/test/output"),
  };
}

describe("dso CLI", () => {
  it("dispatches pull", async () => {
    const streams = io();
    const deps = dependencies();

    expect(await runCli(["pull", "--release", crypto.randomUUID()], streams, deps)).toBe(
      0,
    );
    expect(deps.runPull).toHaveBeenCalledOnce();
    expect(streams.stdout.write).toHaveBeenCalledWith(
      "Release cached at /test/cache/release.json\n",
    );
  });

  it("fails an unknown command", async () => {
    const streams = io();

    expect(await runCli(["unknown"], streams)).toBe(2);
    expect(streams.stderr.write).toHaveBeenCalledWith("Unknown command: unknown\n");
  });

  it("dispatches generate", async () => {
    const streams = io();
    const deps = dependencies();

    expect(
      await runCli(
        ["generate", "--release", crypto.randomUUID(), "--force"],
        streams,
        deps,
      ),
    ).toBe(0);
    expect(deps.runGenerate).toHaveBeenCalledWith([
      "--release",
      expect.any(String),
      "--force",
    ]);
    expect(streams.stdout.write).toHaveBeenCalledWith(
      "Generated tokens.json and tokens.css in /test/output\n",
    );
  });

  it("requires a release identifier for pull", async () => {
    const deps = dependencies();
    deps.runPull.mockRejectedValueOnce(new CliUsageError("missing release"));
    await expect(runCli(["pull"], io(), deps)).rejects.toBeInstanceOf(CliUsageError);
  });

  it("provides help without an API key argument option", async () => {
    const streams = io();

    expect(await runCli(["--help"], streams)).toBe(0);
    const output = String(vi.mocked(streams.stdout.write).mock.calls[0]?.[0]);
    expect(output).toContain("pull --release <release-id>");
    expect(output).toContain("generate --release <release-id>");
    expect(output).toContain("DSO_API_KEY");
    expect(output).not.toMatch(/--api-key|--credential/u);
  });

  it("supports version and command help", async () => {
    const streams = io();

    expect(await runCli(["--version"], streams)).toBe(0);
    expect(await runCli(["pull", "--help"], streams, dependencies())).toBe(0);
  });

  it("supports command help without dispatching pull", async () => {
    const deps = dependencies();
    await runCli(["pull", "--help"], io(), deps);
    expect(deps.runPull).not.toHaveBeenCalled();
  });

  it("supports generate help without dispatching generation", async () => {
    const deps = dependencies();
    await runCli(["generate", "--help"], io(), deps);
    expect(deps.runGenerate).not.toHaveBeenCalled();
  });

  it.skipIf(process.platform === "win32")(
    "runs main through an npm-style bin symlink",
    async () => {
      const directory = await mkdtemp(join(tmpdir(), "dso-bin-"));
      const binPath = join(directory, "dso");

      try {
        await symlink(builtCli, binPath);
        const result = await execFileAsync(process.execPath, [binPath, "--version"]);

        expect(result.stdout).toBe("0.0.0\n");
        expect(result.stderr).toBe("");
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    },
  );
});
