import { runCli } from "@repo/cli/cli";
import { CliUsageError } from "@repo/cli/errors";
import { execFile } from "node:child_process";
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

describe("dso CLI", () => {
  it("dispatches pull", async () => {
    const streams = io();

    expect(await runCli(["pull", "release-id"], streams)).toBe(0);
    expect(streams.stdout.write).toHaveBeenCalledWith("Pull command recognized.\n");
  });

  it("fails an unknown command", async () => {
    const streams = io();

    expect(await runCli(["unknown"], streams)).toBe(2);
    expect(streams.stderr.write).toHaveBeenCalledWith("Unknown command: unknown\n");
  });

  it("requires a release identifier for pull", async () => {
    await expect(runCli(["pull"], io())).rejects.toBeInstanceOf(CliUsageError);
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
    expect(await runCli(["pull", "--help"], streams)).toBe(0);
  });

  it("runs the built dso entry point with pull", async () => {
    const result = await execFileAsync(process.execPath, [
      builtCli,
      "pull",
      "release-id",
    ]);

    expect(result.stdout).toContain("Pull command recognized.");
    expect(result.stderr).toBe("");
  });
});
