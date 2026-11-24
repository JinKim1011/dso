import { lstat, realpath } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

export class OutputPathError extends Error {
  readonly exitCode = 1;

  constructor(message = "The output path is not safe.") {
    super(message);
    this.name = "OutputPathError";
  }
}

function isWithin(root: string, target: string): boolean {
  const relativePath = relative(root, target);

  return (
    relativePath === "" ||
    (!relativePath.startsWith(`..${sep}`) &&
      relativePath !== ".." &&
      !relativePath.includes(`\0`))
  );
}

export async function resolveOutputRoot(outputPath: string): Promise<string> {
  const requested = resolve(outputPath);

  let stat;

  try {
    stat = await lstat(requested);
  } catch {
    throw new OutputPathError("The output root must already exist.");
  }

  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new OutputPathError("The output root must be a real directory.");
  }

  const canonical = await realpath(requested);

  return canonical;
}

export async function resolveOwnedArtifactPath(
  outputRoot: string,
  fileName: string,
): Promise<string> {
  if (fileName !== "tokens.json" && fileName !== "tokens.css") {
    throw new OutputPathError("Only tokens.json and tokens.css are owned artifacts.");
  }

  const root = await resolveOutputRoot(outputRoot);
  const target = resolve(root, fileName);

  if (dirname(target) !== root || !isWithin(root, target)) {
    throw new OutputPathError("The artifact path must remain below the output root.");
  }

  let stat;

  try {
    stat = await lstat(target);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return target;
    }
    throw error;
  }

  if (stat.isSymbolicLink()) {
    throw new OutputPathError("Generated artifact targets cannot be symbolic links.");
  }

  if (!stat.isFile()) {
    throw new OutputPathError("Generated artifact targets must be regular files.");
  }

  return target;
}
