import { requireReleaseId } from "@repo/cli/cache/cache-path";
import { CliUsageError } from "@repo/cli/errors";

type PullArguments = Readonly<{
  releaseId: string;
  apiUrl?: string;
  trustFile?: string;
  cacheDirectory?: string;
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

  if (!value || value.startsWith("--")) {
    throw new CliUsageError(`${argument} needs a value.`);
  }

  return { value, nextIndex: index + 2 };
}

export function parsePullArguments(args: readonly string[]): PullArguments {
  let releaseId: string | undefined;
  let apiUrl: string | undefined;
  let trustFile: string | undefined;
  let cacheDirectory: string | undefined;

  for (let index = 0; index < args.length;) {
    const argument = args[index]!;
    const isOption =
      argument === "--release" ||
      argument.startsWith("--release=") ||
      argument === "--api-url" ||
      argument.startsWith("--api-url=") ||
      argument === "--trust-file" ||
      argument.startsWith("--trust-file=") ||
      argument === "--cache-dir" ||
      argument.startsWith("--cache-dir=");

    if (isOption) {
      const option = readOption(args, index);

      if (argument.startsWith("--release")) {
        if (releaseId) {
          throw new CliUsageError("--release may only be specified once.");
        }

        releaseId = option.value;
      } else if (argument.startsWith("--api-url")) {
        if (apiUrl) {
          throw new CliUsageError("--api-url may only be specified once.");
        }

        apiUrl = option.value;
      } else if (argument.startsWith("--trust-file")) {
        if (trustFile) {
          throw new CliUsageError("--trust-file may only be specified once.");
        }

        trustFile = option.value;
      } else {
        if (cacheDirectory) {
          throw new CliUsageError("--cache-dir may only be specified once.");
        }

        cacheDirectory = option.value;
      }

      index = option.nextIndex;

      continue;
    }

    if (argument.startsWith("-")) {
      throw new CliUsageError(`Unknown pull option: ${argument}`);
    }

    if (releaseId) {
      throw new CliUsageError("A release ID may only be specified once.");
    }

    releaseId = argument;

    index += 1;
  }

  if (!releaseId) {
    throw new CliUsageError("Usage: dso pull --release <release-id>");
  }

  return {
    releaseId: requireReleaseId(releaseId),
    apiUrl,
    trustFile,
    cacheDirectory,
  };
}
