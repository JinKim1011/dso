#!/usr/bin/env node

import { runPull } from "@repo/cli/commands/pull";
import { CliUsageError } from "@repo/cli/errors";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type CliIo = {
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
};

type CliDependencies = {
  runPull: (args: readonly string[]) => Promise<string>;
};

const defaultDependencies: CliDependencies = {
  runPull,
};

const HELP = `Usage: dso <command> [options]

Commands:
  pull --release <release-id>  Download and verify a published release

Options:
  -h, --help         Show this help
  -v, --version      Show the CLI version
      --release       Release ID
      --trust-file    Trust file path
      --cache-dir     Cache directory
      --api-url       API base URL

Authentication:
  The pull command reads its API key from DSO_API_KEY.
`;

export async function runCli(
  args: readonly string[],
  io: CliIo = { stdout: process.stdout, stderr: process.stderr },
  dependencies: CliDependencies = defaultDependencies,
): Promise<number> {
  const [command, ...commandArgs] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    io.stdout.write(HELP);
    return 0;
  }

  if (command === "--version" || command === "-v") {
    io.stdout.write("0.0.0\n");
    return 0;
  }

  if (command !== "pull") {
    io.stderr.write(`Unknown command: ${command}\n`);
    return 2;
  }

  if (commandArgs.includes("--help") || commandArgs.includes("-h")) {
    io.stdout.write(HELP);
    return 0;
  }

  const cacheFilePath = await dependencies.runPull(commandArgs);
  io.stdout.write(`Release cached at ${cacheFilePath}\n`);
  return 0;
}

export async function main(
  args: readonly string[] = process.argv.slice(2),
): Promise<number> {
  try {
    return await runCli(args);
  } catch (error) {
    if (error instanceof CliUsageError) {
      process.stderr.write(`${error.message}\n`);

      return error.exitCode;
    }

    process.stderr.write("The command could not be completed.\n");
    return 1;
  }
}

if (process.argv[1]) {
  const entryPath = realpathSync(process.argv[1]);
  const modulePath = realpathSync(fileURLToPath(import.meta.url));

  if (entryPath === modulePath) {
    process.exitCode = await main();
  }
}
