import { releaseCachePath } from "@repo/cli/cache/cache-path";
import { readVerifiedReleaseCache } from "@repo/cli/cache/read-release-cache";
import { writeVerifiedReleaseCache } from "@repo/cli/cache/release-cache";
import { runGenerate, type GenerateDependencies } from "@repo/cli/commands/generate";
import {
  installGeneratedArtifacts,
  type AtomicArtifactDependencies,
} from "@repo/cli/output/atomic-artifacts";
import { generateKeyPairSync } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename as fsRename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import type {
  PublishedReleaseResponse,
  SignedPublishedReleaseResponse,
} from "@repo/contracts/operation";
import { createSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { generateTokenArtifacts } from "@repo/generator/generator";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const releaseId = "00000000-0000-4000-8000-000000000020";
const projectId = "00000000-0000-4000-8000-000000000010";
const keyId = "release-key-e2e";
const keyPair = generateKeyPairSync("ed25519");
const directories: string[] = [];

const typeIds = {
  colorPrimitive: "00000000-0000-4000-8000-000000000101",
  colorSemantic: "00000000-0000-4000-8000-000000000102",
  fontSize: "00000000-0000-4000-8000-000000000103",
  fontWeight: "00000000-0000-4000-8000-000000000104",
  lineHeight: "00000000-0000-4000-8000-000000000105",
  typography: "00000000-0000-4000-8000-000000000106",
} as const;

const tokenIds = {
  light: "00000000-0000-4000-8000-000000000201",
  dark: "00000000-0000-4000-8000-000000000202",
  size: "00000000-0000-4000-8000-000000000203",
  weight: "00000000-0000-4000-8000-000000000204",
  lineHeight: "00000000-0000-4000-8000-000000000205",
  surface: "00000000-0000-4000-8000-000000000206",
  heading: "00000000-0000-4000-8000-000000000207",
} as const;

function releasePayload(): PublishedReleaseResponse {
  return {
    schemaVersion: 1,
    release: {
      id: releaseId,
      projectId,
      version: "1",
      status: "published",
      createdAt: "2026-11-20T10:00:00.000Z",
      publishedAt: "2026-11-20T10:05:00.000Z",
    },
    tokenTypes: [
      {
        id: typeIds.colorPrimitive,
        projectId,
        parentTypeId: null,
        category: "color",
        name: "Base",
        kind: "primitive",
      },
      {
        id: typeIds.colorSemantic,
        projectId,
        parentTypeId: typeIds.colorPrimitive,
        category: "color",
        name: "surface",
        kind: "semantic",
      },
      {
        id: typeIds.fontSize,
        projectId,
        parentTypeId: null,
        category: "typography",
        name: "font-size",
        kind: "primitive",
      },
      {
        id: typeIds.fontWeight,
        projectId,
        parentTypeId: null,
        category: "typography",
        name: "font-weight",
        kind: "primitive",
      },
      {
        id: typeIds.lineHeight,
        projectId,
        parentTypeId: null,
        category: "typography",
        name: "line-height",
        kind: "primitive",
      },
      {
        id: typeIds.typography,
        projectId,
        parentTypeId: null,
        category: "typography",
        name: "typography",
        kind: "semantic",
      },
    ],
    tokens: [
      {
        id: tokenIds.surface,
        projectId,
        tokenTypeId: typeIds.colorSemantic,
        name: "surface",
        cssVar: "--ignored-semantic",
        value: { kind: "modes" },
      },
      {
        id: tokenIds.dark,
        projectId,
        tokenTypeId: typeIds.colorPrimitive,
        name: "neutral-900",
        cssVar: "--ignored-dark",
        value: { kind: "single", value: "oklch(14.5% 0 0)" },
      },
      {
        id: tokenIds.light,
        projectId,
        tokenTypeId: typeIds.colorPrimitive,
        name: "neutral-0",
        cssVar: "--ignored-light",
        value: { kind: "single", value: "oklch(98.5% 0 0)" },
      },
      {
        id: tokenIds.size,
        projectId,
        tokenTypeId: typeIds.fontSize,
        name: "title",
        cssVar: null,
        value: { kind: "single", value: "1.125rem" },
      },
      {
        id: tokenIds.weight,
        projectId,
        tokenTypeId: typeIds.fontWeight,
        name: "bold",
        cssVar: null,
        value: { kind: "single", value: "700" },
      },
      {
        id: tokenIds.lineHeight,
        projectId,
        tokenTypeId: typeIds.lineHeight,
        name: "tight",
        cssVar: null,
        value: { kind: "single", value: "1.3" },
      },
      {
        id: tokenIds.heading,
        projectId,
        tokenTypeId: typeIds.typography,
        name: "heading-strong",
        cssVar: "--ignored-typography",
        value: { kind: "typography" },
      },
    ],
    references: [
      {
        referencingTokenId: tokenIds.surface,
        referencedTokenId: tokenIds.light,
        projectId,
        slot: "light",
      },
      {
        referencingTokenId: tokenIds.surface,
        referencedTokenId: tokenIds.dark,
        projectId,
        slot: "dark",
      },
      {
        referencingTokenId: tokenIds.heading,
        referencedTokenId: tokenIds.size,
        projectId,
        slot: "fontSize",
      },
      {
        referencingTokenId: tokenIds.heading,
        referencedTokenId: tokenIds.weight,
        projectId,
        slot: "fontWeight",
      },
      {
        referencingTokenId: tokenIds.heading,
        referencedTokenId: tokenIds.lineHeight,
        projectId,
        slot: "lineHeight",
      },
    ],
    components: [],
    templates: [],
  };
}

function signedRelease(
  payload: PublishedReleaseResponse = releasePayload(),
  key = keyPair.privateKey,
  signingKeyId = keyId,
): SignedPublishedReleaseResponse {
  return createSignedReleaseEnvelope(payload, { privateKey: key, keyId: signingKeyId });
}

type Fixture = {
  root: string;
  cacheDirectory: string;
  trustFilePath: string;
  outputA: string;
  outputB: string;
  cachePath: string;
};

async function fixture(
  envelope: SignedPublishedReleaseResponse = signedRelease(),
): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), "dso-generate-e2e-"));
  directories.push(root);
  const cacheDirectory = join(root, "cache");
  const trustFilePath = join(root, "trust.json");
  const outputA = join(root, "output-a");
  const outputB = join(root, "output-b");
  await mkdir(outputA);
  await mkdir(outputB);
  await writeFile(join(outputA, "README.md"), "keep-a");
  await writeFile(join(outputB, "README.md"), "keep-b");
  await writeFile(
    trustFilePath,
    JSON.stringify({
      keys: {
        [keyId]: keyPair.publicKey.export({ format: "pem", type: "spki" }).toString(),
      },
    }),
  );
  const cachePath = releaseCachePath(cacheDirectory, releaseId);
  await writeVerifiedReleaseCache(cachePath, envelope);
  return { root, cacheDirectory, trustFilePath, outputA, outputB, cachePath };
}

function generateArgs(context: Fixture, outputPath = context.outputA): string[] {
  return [
    "--release",
    releaseId,
    "--cache-dir",
    context.cacheDirectory,
    "--trust-file",
    context.trustFilePath,
    "--output",
    outputPath,
    "--force",
  ];
}

async function outputBytes(outputPath: string): Promise<Record<string, Buffer>> {
  const result: Record<string, Buffer> = {};
  for (const name of ["tokens.json", "tokens.css", "README.md"]) {
    try {
      result[name] = await readFile(join(outputPath, name));
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }
  }
  return result;
}

async function expectGenerationFailure(
  context: Fixture,
  args = generateArgs(context),
  dependencies?: Partial<GenerateDependencies>,
): Promise<void> {
  const cacheBefore = await readFile(context.cachePath);
  const outputBefore = await outputBytes(context.outputA);
  const merged: GenerateDependencies | undefined = dependencies
    ? {
        loadConfiguration: (overrides) => ({
          outputPath: overrides.outputPath!,
          trustFilePath: overrides.trustFilePath!,
          cachePath: overrides.cachePath!,
        }),
        readCache: readVerifiedReleaseCache,
        generate: generateTokenArtifacts,
        install: installGeneratedArtifacts,
        ...dependencies,
      }
    : undefined;

  await expect(merged ? runGenerate(args, merged) : runGenerate(args)).rejects.toThrow();

  expect(await readFile(context.cachePath)).toEqual(cacheBefore);
  expect(await outputBytes(context.outputA)).toEqual(outputBefore);
  expect(
    (await readdir(context.outputA)).filter((name) => name.startsWith(".dso-")),
  ).toEqual([]);
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("dso generate integration", () => {
  it("generates byte-identical artifacts in different output roots", async () => {
    const context = await fixture();
    await runGenerate(generateArgs(context, context.outputA));
    await runGenerate(generateArgs(context, context.outputB));

    expect(await readFile(join(context.outputA, "tokens.json"))).toEqual(
      await readFile(join(context.outputB, "tokens.json")),
    );
    expect(await readFile(join(context.outputA, "tokens.css"))).toEqual(
      await readFile(join(context.outputB, "tokens.css")),
    );
    const tokensJson = await readFile(join(context.outputA, "tokens.json"), "utf8");
    const tokensCss = await readFile(join(context.outputA, "tokens.css"), "utf8");
    expect(tokensJson).toContain('"cssVar": "--color-surface"');
    expect(tokensJson).toContain('"light": "var(--base-neutral-0)"');
    expect(tokensCss).toContain("--color-surface: var(--base-neutral-0);");
    expect(tokensCss).toContain(".text-heading-strong");
    expect(await readFile(join(context.outputA, "README.md"), "utf8")).toBe("keep-a");
    expect(await readFile(join(context.outputB, "README.md"), "utf8")).toBe("keep-b");
  });

  it("rejects tampered and invalid-schema cache without changing output", async () => {
    const context = await fixture();
    await writeFile(join(context.outputA, "tokens.json"), "old-json");
    const cache = JSON.parse(await readFile(context.cachePath, "utf8"));
    cache.release.version = "2";
    await writeFile(context.cachePath, `${JSON.stringify(cache)}\n`);
    await expectGenerationFailure(context);

    const invalid = structuredClone(signedRelease());
    (invalid as { schemaVersion: number }).schemaVersion = 2;
    await writeFile(context.cachePath, `${JSON.stringify(invalid)}\n`);
    await expectGenerationFailure(context);
  });

  it("rejects an unknown signing key without changing output", async () => {
    const context = await fixture();
    await writeFile(join(context.outputA, "tokens.json"), "old-json");
    const other = generateKeyPairSync("ed25519")
      .publicKey.export({ format: "pem", type: "spki" })
      .toString();
    await writeFile(context.trustFilePath, JSON.stringify({ keys: { [keyId]: other } }));

    await expectGenerationFailure(context);
  });

  it.each([
    [
      "unresolved token",
      (release: PublishedReleaseResponse) => {
        release.tokens.push({
          id: "00000000-0000-4000-8000-000000000299",
          projectId,
          tokenTypeId: typeIds.colorSemantic,
          name: "unresolved",
          cssVar: null,
          value: { kind: "unresolved" },
        });
      },
    ],
    [
      "unsafe CSS value",
      (release: PublishedReleaseResponse) => {
        release.tokens.find((token) => token.id === tokenIds.light)!.value = {
          kind: "single",
          value: "oklch(50% 0 0 url",
        };
      },
    ],
    [
      "CSS injection",
      (release: PublishedReleaseResponse) => {
        release.tokens.find((token) => token.id === tokenIds.light)!.value = {
          kind: "single",
          value: "#fff; color: red",
        };
      },
    ],
  ])("rejects %s without changing cache or output", async (_name, mutate) => {
    const payload = releasePayload();
    mutate(payload);
    const context = await fixture(signedRelease(payload));
    await writeFile(join(context.outputA, "tokens.json"), "old-json");
    await writeFile(join(context.outputA, "tokens.css"), "old-css");

    await expectGenerationFailure(context);
  });

  it("rejects output root and target symlinks", async () => {
    const context = await fixture();
    const rootLink = join(context.root, "output-link");
    await symlink(context.outputA, rootLink);
    await expect(runGenerate(generateArgs(context, rootLink))).rejects.toThrow();

    const targetLink = join(context.outputA, "tokens.json");
    const actualTarget = join(context.root, "outside.json");
    await writeFile(actualTarget, "outside");
    await symlink(actualTarget, targetLink);
    await expect(runGenerate(generateArgs(context))).rejects.toThrow();
    expect(await readFile(actualTarget, "utf8")).toBe("outside");
  });

  it("fails non-interactively on an overwrite conflict", async () => {
    const context = await fixture();
    await writeFile(join(context.outputA, "tokens.json"), "old-json");

    await expectGenerationFailure(
      context,
      generateArgs(context).filter((arg) => arg !== "--force"),
    );
  });

  it("rolls back both owned artifacts when the second rename fails", async () => {
    const context = await fixture();
    const output = await realpath(context.outputA);
    const cssPath = join(output, "tokens.css");
    await writeFile(join(output, "tokens.json"), "old-json");
    await writeFile(cssPath, "old-css");
    let failed = false;
    const rename = vi.fn(async (source: string, target: string) => {
      if (target === cssPath && !failed) {
        failed = true;
        throw new Error("injected second rename failure");
      }
      await fsRename(source, target);
    });
    const atomicDependencies: AtomicArtifactDependencies = {
      applyOverwritePolicy: vi.fn().mockResolvedValue(undefined),
      rename,
    };

    await expectGenerationFailure(context, generateArgs(context), {
      install: (options) => installGeneratedArtifacts(options, atomicDependencies),
    });
  });
});
