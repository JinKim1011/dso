import {
  createOverwritePrompt,
  type OverwritePrompt,
} from "@repo/cli/output/confirm-overwrite";
import { lstat } from "node:fs/promises";
import { join } from "node:path";

export const OWNED_GENERATED_FILE_NAMES = ["tokens.json", "tokens.css"] as const;

export class OverwriteDeclinedError extends Error {
  readonly exitCode = 1;

  constructor() {
    super(
      "Generation was cancelled because existing generated artifacts were not overwritten.",
    );
    this.name = "OverwriteDeclinedError";
  }
}

export class NonInteractiveOverwriteError extends Error {
  readonly exitCode = 1;

  constructor() {
    super("Generated artifacts already exist. Re-run with --force to overwrite them.");
    this.name = "NonInteractiveOverwriteError";
  }
}

type ApplyOverwritePolicyOptions = Readonly<{
  outputPath: string;
  force: boolean;
}>;

type OverwritePolicyDependencies = Readonly<{
  prompt: OverwritePrompt;
  pathExists: (path: string) => Promise<boolean>;
}>;

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

const defaultDependencies: OverwritePolicyDependencies = {
  prompt: createOverwritePrompt(),
  pathExists,
};

function overwriteMessage(existing: readonly string[]): string {
  const names = existing.join(" and ");
  const verb = existing.length === 1 ? "exists" : "exist";

  return `${names} already ${verb}. Overwrite generated artifacts?`;
}

export async function applyOverwritePolicy(
  options: ApplyOverwritePolicyOptions,
  dependencies: OverwritePolicyDependencies = defaultDependencies,
): Promise<void> {
  const existing: string[] = [];

  for (const fileName of OWNED_GENERATED_FILE_NAMES) {
    if (await dependencies.pathExists(join(options.outputPath, fileName))) {
      existing.push(fileName);
    }
  }

  if (existing.length === 0 || options.force) return;

  if (!dependencies.prompt.isInteractive()) {
    throw new NonInteractiveOverwriteError();
  }

  if (!(await dependencies.prompt.confirm(overwriteMessage(existing)))) {
    throw new OverwriteDeclinedError();
  }
}
