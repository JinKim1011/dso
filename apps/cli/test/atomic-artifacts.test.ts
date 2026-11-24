import {
  installGeneratedArtifacts,
  type AtomicArtifactDependencies,
} from "@repo/cli/output/atomic-artifacts";
import {
  chmod,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { rename as fsRename } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const directories: string[] = [];
const contents = { tokensJson: '{"new":true}\n', tokensCss: ":root {}\n" };

async function directory(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), "dso-atomic-artifacts-"));
  directories.push(value);
  return value;
}

function dependencies(): AtomicArtifactDependencies {
  return {
    applyOverwritePolicy: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn(fsRename),
  };
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((value) => rm(value, { recursive: true, force: true })),
  );
});

describe("atomic generated artifacts", () => {
  it("installs both artifacts and preserves unrelated files", async () => {
    const outputPath = await directory();
    await writeFile(join(outputPath, "README.md"), "keep");

    await installGeneratedArtifacts(
      { outputPath, force: true, contents },
      dependencies(),
    );

    expect(await readFile(join(outputPath, "tokens.json"), "utf8")).toBe(
      contents.tokensJson,
    );
    expect(await readFile(join(outputPath, "tokens.css"), "utf8")).toBe(
      contents.tokensCss,
    );
    expect(await readFile(join(outputPath, "README.md"), "utf8")).toBe("keep");
    expect((await stat(join(outputPath, "tokens.json"))).mode & 0o777).toBe(0o644);
    expect((await stat(join(outputPath, "tokens.css"))).mode & 0o777).toBe(0o644);
    expect(
      (await readdir(outputPath)).filter((name) => name.startsWith(".dso-")),
    ).toEqual([]);
  });

  it("replaces both existing artifacts when forced", async () => {
    const outputPath = await directory();
    const canonicalOutputPath = await realpath(outputPath);
    await writeFile(join(outputPath, "tokens.json"), "old-json");
    await writeFile(join(outputPath, "tokens.css"), "old-css");
    const deps = dependencies();

    await installGeneratedArtifacts({ outputPath, force: true, contents }, deps);

    expect(deps.applyOverwritePolicy).toHaveBeenCalledWith({
      outputPath: canonicalOutputPath,
      force: true,
    });
    expect(await readFile(join(outputPath, "tokens.json"), "utf8")).toBe(
      contents.tokensJson,
    );
    expect(await readFile(join(outputPath, "tokens.css"), "utf8")).toBe(
      contents.tokensCss,
    );
  });

  it("restores both originals when the second install rename fails", async () => {
    const outputPath = await directory();
    const canonicalOutputPath = await realpath(outputPath);
    const jsonPath = join(canonicalOutputPath, "tokens.json");
    const cssPath = join(canonicalOutputPath, "tokens.css");
    await writeFile(jsonPath, "old-json");
    await writeFile(cssPath, "old-css");
    let failed = false;
    const rename = vi.fn(async (source: string, target: string) => {
      if (target === cssPath && !failed) {
        failed = true;
        throw new Error("second install failed");
      }
      await fsRename(source, target);
    });

    await expect(
      installGeneratedArtifacts(
        { outputPath, force: true, contents },
        { ...dependencies(), rename },
      ),
    ).rejects.toThrow("second install failed");

    expect(await readFile(jsonPath, "utf8")).toBe("old-json");
    expect(await readFile(cssPath, "utf8")).toBe("old-css");
    expect(
      (await readdir(outputPath)).filter((name) => name.startsWith(".dso-")),
    ).toEqual([]);
  });

  it("removes newly installed artifacts when a later install rename fails", async () => {
    const outputPath = await directory();
    const canonicalOutputPath = await realpath(outputPath);
    const cssPath = join(canonicalOutputPath, "tokens.css");
    const rename = vi.fn(async (source: string, target: string) => {
      if (target === cssPath) throw new Error("second install failed");
      await fsRename(source, target);
    });

    await expect(
      installGeneratedArtifacts(
        { outputPath, force: true, contents },
        { ...dependencies(), rename },
      ),
    ).rejects.toThrow("second install failed");

    await expect(readFile(join(outputPath, "tokens.json"), "utf8")).rejects.toThrow();
    await expect(readFile(join(outputPath, "tokens.css"), "utf8")).rejects.toThrow();
    expect(
      (await readdir(outputPath)).filter((name) => name.startsWith(".dso-")),
    ).toEqual([]);
  });

  it("preserves originals when a backup rename fails", async () => {
    const outputPath = await directory();
    const canonicalOutputPath = await realpath(outputPath);
    const jsonPath = join(canonicalOutputPath, "tokens.json");
    const cssPath = join(canonicalOutputPath, "tokens.css");
    await writeFile(jsonPath, "old-json");
    await writeFile(cssPath, "old-css");
    const rename = vi.fn(async (source: string, target: string) => {
      if (source === cssPath) throw new Error("backup failed");
      await fsRename(source, target);
    });

    await expect(
      installGeneratedArtifacts(
        { outputPath, force: true, contents },
        { ...dependencies(), rename },
      ),
    ).rejects.toThrow("backup failed");

    expect(await readFile(jsonPath, "utf8")).toBe("old-json");
    expect(await readFile(cssPath, "utf8")).toBe("old-css");
  });

  it("leaves output unchanged on overwrite cancellation", async () => {
    const outputPath = await directory();
    await writeFile(join(outputPath, "tokens.json"), "old-json");
    const deps = {
      ...dependencies(),
      applyOverwritePolicy: vi.fn().mockRejectedValue(new Error("cancelled")),
    };

    await expect(
      installGeneratedArtifacts({ outputPath, force: false, contents }, deps),
    ).rejects.toThrow("cancelled");

    expect(await readFile(join(outputPath, "tokens.json"), "utf8")).toBe("old-json");
    expect(
      (await readdir(outputPath)).filter((name) => name.startsWith(".dso-")),
    ).toEqual([]);
  });

  it.skipIf(process.platform === "win32")(
    "leaves output unchanged when staging cannot be written",
    async () => {
      const outputPath = await directory();
      await writeFile(join(outputPath, "tokens.json"), "old-json");
      await chmod(outputPath, 0o555);

      try {
        await expect(
          installGeneratedArtifacts(
            { outputPath, force: true, contents },
            dependencies(),
          ),
        ).rejects.toThrow();
      } finally {
        await chmod(outputPath, 0o755);
      }

      expect(await readFile(join(outputPath, "tokens.json"), "utf8")).toBe("old-json");
    },
  );
});
