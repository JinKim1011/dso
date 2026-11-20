import { runCli } from "@repo/cli/cli";
import { CliUsageError } from "@repo/cli/errors";
import { describe, expect, it, vi } from "vitest";

function io() {
  return {
    stdout: { write: vi.fn() },
    stderr: { write: vi.fn() },
  };
}

function dependencies() {
  return {
    runPull: vi.fn().mockResolvedValue("/test/cache/release.json"),
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
});
