import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const LOCK_NAME = ".dso-generate.lock";

export class OutputLockError extends Error {
  readonly exitCode = 1;

  constructor() {
    super("Another dso generate operation is already running in this output root.");
    this.name = "OutputLockError";
  }
}

export type OutputLock = Readonly<{
  release: () => Promise<void>;
}>;

export async function acquireOutputLock(outputRoot: string): Promise<OutputLock> {
  const lockPath = join(outputRoot, LOCK_NAME);
  let acquired = false;

  try {
    await mkdir(lockPath, { mode: 0o700 });
    acquired = true;
    await writeFile(
      join(lockPath, "owner.json"),
      `${JSON.stringify({ pid: process.pid })}\n`,
      { flag: "wx", mode: 0o600 },
    );
  } catch (error) {
    if (acquired) {
      await rm(lockPath, { recursive: true, force: true }).catch(() => undefined);
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      throw new OutputLockError();
    }

    throw error;
  }

  let released = false;

  return {
    release: async () => {
      if (released) return;
      released = true;
      await rm(lockPath, { recursive: true, force: true });
    },
  };
}
