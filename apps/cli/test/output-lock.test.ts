import { acquireOutputLock, OutputLockError } from "@repo/cli/output/output-lock";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("output lock", () => {
  it("allows one owner and rejects a concurrent acquisition", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "dso-output-lock-"));
    directories.push(outputRoot);
    const lock = await acquireOutputLock(outputRoot);

    await expect(acquireOutputLock(outputRoot)).rejects.toBeInstanceOf(OutputLockError);
    await lock.release();
    await expect(acquireOutputLock(outputRoot)).resolves.toBeDefined();
  });

  it("releases the lock directory", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "dso-output-lock-"));
    directories.push(outputRoot);
    const lock = await acquireOutputLock(outputRoot);
    await lock.release();

    expect(await readdir(outputRoot)).toEqual([]);
  });
});
