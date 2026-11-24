import {
  applyOverwritePolicy,
  NonInteractiveOverwriteError,
  OverwriteDeclinedError,
} from "@repo/cli/output/overwrite-policy";
import { lstat, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createOverwritePrompt } from "@repo/cli/output/confirm-overwrite";
import { tmpdir } from "node:os";
import { PassThrough } from "node:stream";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const directories: string[] = [];

async function outputDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "dso-overwrite-"));
  directories.push(directory);
  return directory;
}

function prompt(isInteractive: boolean, accepted = false) {
  return {
    isInteractive: vi.fn(() => isInteractive),
    confirm: vi.fn().mockResolvedValue(accepted),
  };
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("overwrite policy", () => {
  it("does nothing when owned artifacts do not exist", async () => {
    const outputPath = await outputDirectory();
    await writeFile(join(outputPath, "notes.txt"), "keep");
    const terminal = prompt(true, true);

    await applyOverwritePolicy(
      { outputPath, force: false },
      { prompt: terminal, pathExists: async (path) => path.endsWith("missing") },
    );

    expect(terminal.confirm).not.toHaveBeenCalled();
    expect(await readFile(join(outputPath, "notes.txt"), "utf8")).toBe("keep");
  });

  it("never prompts when force is enabled", async () => {
    const outputPath = await outputDirectory();
    await writeFile(join(outputPath, "tokens.json"), "old-json");
    await writeFile(join(outputPath, "tokens.css"), "old-css");
    const terminal = prompt(true, false);

    await applyOverwritePolicy(
      { outputPath, force: true },
      {
        prompt: terminal,
        pathExists: async () => true,
      },
    );

    expect(terminal.isInteractive).not.toHaveBeenCalled();
    expect(terminal.confirm).not.toHaveBeenCalled();
  });

  it.each([
    ["y", true],
    ["yes", true],
    ["n", false],
    ["", false],
  ])("maps prompt answer %s to continuation %s", async (_answer, accepted) => {
    const outputPath = await outputDirectory();
    const terminal = prompt(true, accepted);

    if (accepted) {
      await applyOverwritePolicy(
        { outputPath, force: false },
        {
          prompt: terminal,
          pathExists: async (path) => path.endsWith("tokens.json"),
        },
      );
    } else {
      await expect(
        applyOverwritePolicy(
          { outputPath, force: false },
          {
            prompt: terminal,
            pathExists: async (path) => path.endsWith("tokens.json"),
          },
        ),
      ).rejects.toBeInstanceOf(OverwriteDeclinedError);
    }

    expect(terminal.confirm).toHaveBeenCalledWith(
      "tokens.json already exists. Overwrite generated artifacts?",
    );
  });

  it("fails immediately without prompting in non-interactive execution", async () => {
    const outputPath = await outputDirectory();
    const terminal = prompt(false);

    await expect(
      applyOverwritePolicy(
        { outputPath, force: false },
        { prompt: terminal, pathExists: async () => true },
      ),
    ).rejects.toBeInstanceOf(NonInteractiveOverwriteError);

    expect(terminal.confirm).not.toHaveBeenCalled();
  });

  it("ignores unrelated files and preserves output when declined", async () => {
    const outputPath = await outputDirectory();
    const tokensPath = join(outputPath, "tokens.json");
    const unrelatedPath = join(outputPath, "README.md");
    await writeFile(tokensPath, "original");
    await writeFile(unrelatedPath, "preserve");
    const terminal = prompt(true, false);

    await expect(
      applyOverwritePolicy(
        { outputPath, force: false },
        {
          prompt: terminal,
          pathExists: async (path) => {
            try {
              await lstat(path);
              return true;
            } catch {
              return false;
            }
          },
        },
      ),
    ).rejects.toBeInstanceOf(OverwriteDeclinedError);

    expect(await readFile(tokensPath, "utf8")).toBe("original");
    expect(await readFile(unrelatedPath, "utf8")).toBe("preserve");
  });

  it.each([
    ["y\n", true],
    ["yes\n", true],
    ["n\n", false],
    ["\n", false],
  ])("handles interactive TTY answer %s", async (answer, expected) => {
    const input = new PassThrough() as PassThrough & { isTTY: boolean };
    const output = new PassThrough();
    input.isTTY = true;
    const terminal = createOverwritePrompt(input, output);
    const result = terminal.confirm("Overwrite?");
    input.write(answer);

    await expect(result).resolves.toBe(expected);
  });
});
