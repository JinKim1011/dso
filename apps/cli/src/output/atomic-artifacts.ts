import {
  resolveOutputRoot,
  resolveOwnedArtifactPath,
} from "@repo/cli/output/output-path";
import { applyOverwritePolicy } from "@repo/cli/output/overwrite-policy";
import { randomUUID } from "node:crypto";
import { chmod, lstat, mkdir, open, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export class ArtifactTransactionError extends Error {
  readonly exitCode = 1;

  constructor(
    message = "The generated artifacts could not be installed.",
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "ArtifactTransactionError";
  }
}

export type GeneratedArtifactContents = Readonly<{
  tokensJson: string;
  tokensCss: string;
}>;

type InstallGeneratedArtifactsOptions = Readonly<{
  outputPath: string;
  force: boolean;
  contents: GeneratedArtifactContents;
}>;

export type AtomicArtifactDependencies = Readonly<{
  applyOverwritePolicy: typeof applyOverwritePolicy;
  rename: (oldPath: string, newPath: string) => Promise<void>;
}>;

const defaultDependencies: AtomicArtifactDependencies = {
  applyOverwritePolicy,
  rename,
};

type TransactionPath = Readonly<{
  name: "tokens.json" | "tokens.css";
  target: string;
  staged: string;
  backup: string;
}>;

async function exists(path: string): Promise<boolean> {
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

async function stageFile(path: string, contents: string): Promise<void> {
  const handle = await open(path, "wx", 0o644);

  try {
    await writeFile(handle, contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }

  await chmod(path, 0o644);
}

async function rollback(
  transactionPaths: readonly TransactionPath[],
  backedUp: ReadonlySet<string>,
  installed: ReadonlySet<string>,
  renameFile: AtomicArtifactDependencies["rename"],
): Promise<void> {
  for (const path of [...transactionPaths].reverse()) {
    if (installed.has(path.target)) {
      await rm(path.target, { force: true });
    }
  }

  for (const path of [...transactionPaths].reverse()) {
    if (backedUp.has(path.backup)) {
      await renameFile(path.backup, path.target);
    }
  }
}

export async function installGeneratedArtifacts(
  options: InstallGeneratedArtifactsOptions,
  dependencies: AtomicArtifactDependencies = defaultDependencies,
): Promise<void> {
  const outputRoot = await resolveOutputRoot(options.outputPath);
  const transactionDirectory = join(outputRoot, `.dso-generate-${randomUUID()}`);
  const paths: TransactionPath[] = [
    {
      name: "tokens.json",
      target: await resolveOwnedArtifactPath(outputRoot, "tokens.json"),
      staged: join(transactionDirectory, "tokens.json"),
      backup: join(transactionDirectory, "tokens.json.backup"),
    },
    {
      name: "tokens.css",
      target: await resolveOwnedArtifactPath(outputRoot, "tokens.css"),
      staged: join(transactionDirectory, "tokens.css"),
      backup: join(transactionDirectory, "tokens.css.backup"),
    },
  ];

  const backedUp = new Set<string>();
  const installed = new Set<string>();
  let cleanupSafe = false;

  try {
    await mkdir(transactionDirectory, { mode: 0o700 });
    await stageFile(paths[0]!.staged, options.contents.tokensJson);
    await stageFile(paths[1]!.staged, options.contents.tokensCss);

    await dependencies.applyOverwritePolicy({
      outputPath: outputRoot,
      force: options.force,
    });

    for (const path of paths) {
      if (await exists(path.target)) {
        await dependencies.rename(path.target, path.backup);

        backedUp.add(path.backup);
      }
    }

    for (const path of paths) {
      await dependencies.rename(path.staged, path.target);

      installed.add(path.target);
    }

    cleanupSafe = true;
  } catch (error) {
    try {
      await rollback(paths, backedUp, installed, dependencies.rename);

      cleanupSafe = true;
    } catch (rollbackError) {
      throw new ArtifactTransactionError(
        "The generated artifacts could not be installed or restored.",
        rollbackError,
      );
    }

    throw error;
  } finally {
    if (cleanupSafe) {
      await rm(transactionDirectory, { recursive: true, force: true }).catch(
        () => undefined,
      );
    }
  }
}
