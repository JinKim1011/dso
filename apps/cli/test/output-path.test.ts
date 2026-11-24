import {
  resolveOutputRoot,
  resolveOwnedArtifactPath,
} from "@repo/cli/output/output-path";
import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const directories: string[] = [];

async function directory(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), "dso-output-path-"));
  directories.push(value);
  return value;
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((value) => rm(value, { recursive: true, force: true })),
  );
});

describe("output paths", () => {
  it("resolves the root and owned file names below it", async () => {
    const root = await directory();

    const canonicalRoot = await realpath(root);
    expect(await resolveOutputRoot(root)).toBe(canonicalRoot);
    expect(await resolveOwnedArtifactPath(root, "tokens.json")).toBe(
      join(canonicalRoot, "tokens.json"),
    );
  });

  it("rejects arbitrary artifact names and path traversal", async () => {
    const root = await directory();

    await expect(resolveOwnedArtifactPath(root, "../tokens.json")).rejects.toThrow();
    await expect(resolveOwnedArtifactPath(root, "README.md")).rejects.toThrow();
  });

  it.skipIf(process.platform === "win32")(
    "rejects symlink roots and symlink targets",
    async () => {
      const root = await directory();
      const linkRoot = join(root, "root-link");
      await symlink(root, linkRoot);
      await expect(resolveOutputRoot(linkRoot)).rejects.toThrow();

      const target = join(root, "target");
      const artifact = join(root, "tokens.json");
      await writeFile(target, "data");
      await symlink(target, artifact);

      await expect(resolveOwnedArtifactPath(root, "tokens.json")).rejects.toThrow();
    },
  );

  it("rejects files and directories as roots or artifact targets", async () => {
    const root = await directory();
    await mkdir(join(root, "tokens.css"));

    await expect(
      resolveOutputRoot(join(root, "tokens.css", "missing")),
    ).rejects.toThrow();
    await expect(resolveOwnedArtifactPath(root, "tokens.css")).rejects.toThrow();
  });
});
