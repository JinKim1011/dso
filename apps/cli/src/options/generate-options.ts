import { requireReleaseId } from "@repo/cli/cache/cache-path";
import { CliUsageError } from "@repo/cli/errors";

export type GenerateArguments = Readonly<{
  releaseId: string;
  output?: string;
  trustFile?: string;
  cacheDirectory?: string;
  force: boolean;
}>;

function readOption(
  values: readonly string[],
  index: number,
): { value: string; nextIndex: number } {
  const argument = values[index]!;
  const equals = argument.indexOf("=");

  if (equals >= 0) {
    const value = argument.slice(equals + 1);

    if (value.length === 0) {
      throw new CliUsageError(`${argument.slice(0, equals)} needs a value.`);
    }

    return { value, nextIndex: index + 1 };
  }

  const value = values[index + 1];

  if (!value || value.startsWith("-")) {
    throw new CliUsageError(`${argument} needs a value.`);
  }

  return { value, nextIndex: index + 2 };
}

function setOnce(current: string | undefined, value: string, option: string): string {
  if (current !== undefined) {
    throw new CliUsageError(`${option} may only be specified once.`);
  }

  return value;
}

export function parseGenerateArguments(args: readonly string[]): GenerateArguments {
  let releaseId: string | undefined;
  let output: string | undefined;
  let trustFile: string | undefined;
  let cacheDirectory: string | undefined;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;

    if (argument === "--force") {
      if (force) {
        throw new CliUsageError("--force may only be specified once.");
      }
      force = true;
      continue;
    }

    const isValueOption =
      argument === "--release" ||
      argument.startsWith("--release=") ||
      argument === "--output" ||
      argument.startsWith("--output=") ||
      argument === "--trust-file" ||
      argument.startsWith("--trust-file=") ||
      argument === "--cache-dir" ||
      argument.startsWith("--cache-dir=");

    if (isValueOption) {
      const option = readOption(args, index);

      if (argument.startsWith("--release")) {
        releaseId = setOnce(releaseId, option.value, "--release");
      } else if (argument.startsWith("--output")) {
        output = setOnce(output, option.value, "--output");
      } else if (argument.startsWith("--trust-file")) {
        trustFile = setOnce(trustFile, option.value, "--trust-file");
      } else {
        cacheDirectory = setOnce(cacheDirectory, option.value, "--cache-dir");
      }

      index = option.nextIndex - 1;
      continue;
    }

    if (argument.startsWith("-")) {
      throw new CliUsageError(`Unknown generate option: ${argument}`);
    }

    releaseId = setOnce(releaseId, argument, "--release");
  }

  if (!releaseId) {
    throw new CliUsageError("Usage: dso generate --release <release-id>");
  }

  return {
    releaseId: requireReleaseId(releaseId),
    output,
    trustFile,
    cacheDirectory,
    force,
  };
}
