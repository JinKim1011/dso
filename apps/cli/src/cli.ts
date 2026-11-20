#!/usr/bin/env node

import { CliUsageError } from "@repo/cli/errors";
import {
  loadCliConfiguration,
  type CliConfiguration,
} from "@repo/cli/config/environment";
import { loadReleaseTrustFile } from "@repo/cli/config/trust-file";
import { pathToFileURL } from "node:url";

export type CliIo = {
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
};

type CliDependencies = {
  loadConfiguration: () => CliConfiguration;
  loadTrustFile: (filePath: string) => Promise<ReadonlyMap<string, unknown>>;
};

const defaultDependencies: CliDependencies = {
  loadConfiguration: loadCliConfiguration,
  loadTrustFile: loadReleaseTrustFile,
};

const HELP = `Usage: dso <command> [options]

Commands:
  pull <release-id>  Download and verify a published release

Options:
  -h, --help         Show this help
  -v, --version      Show the CLI version

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

  if (commandArgs.length !== 1) {
    throw new CliUsageError("Usage: dso pull <release-id>");
  }

  const configuration = dependencies.loadConfiguration();
  await dependencies.loadTrustFile(configuration.trustFilePath);

  io.stdout.write("Pull command recognized.\n");
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
