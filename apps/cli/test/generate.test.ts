import { runGenerate, type GenerateDependencies } from "@repo/cli/commands/generate";
import type { GenerateConfiguration } from "@repo/cli/config/generate-environment";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { describe, expect, it, vi } from "vitest";

const releaseId = "00000000-0000-4000-8000-000000000001";
const envelope = {
  schemaVersion: 1,
  release: {
    id: releaseId,
    projectId: "00000000-0000-4000-8000-000000000002",
    version: "1",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    publishedAt: "2026-01-01T00:00:00.000Z",
  },
  tokenTypes: [],
  tokens: [],
  references: [],
  components: [],
  templates: [],
  signature: {
    algorithm: "Ed25519",
    keyId: "key-1",
    value: "A".repeat(86),
  },
} satisfies SignedPublishedReleaseResponse;

function configuration(): GenerateConfiguration {
  return {
    outputPath: "/workspace/output",
    cachePath: "/workspace/cache",
    trustFilePath: "/workspace/trust.json",
  };
}

function dependencies(): GenerateDependencies {
  return {
    loadConfiguration: vi.fn().mockReturnValue(configuration()),
    readCache: vi.fn().mockResolvedValue(envelope),
    generate: vi.fn().mockReturnValue({
      tokensJson: '{"schemaVersion":1}\n',
      tokensCss: ":root {}\n",
    }),
    install: vi.fn().mockResolvedValue(undefined),
  };
}

describe("generate command", () => {
  it("re-verifies cache, generates, and atomically installs artifacts", async () => {
    const deps = dependencies();

    await expect(
      runGenerate(["--release", releaseId, "--output", "./out", "--force"], deps),
    ).resolves.toBe("/workspace/output");

    expect(deps.loadConfiguration).toHaveBeenCalledWith({
      outputPath: "./out",
      cachePath: undefined,
      trustFilePath: undefined,
    });
    expect(deps.readCache).toHaveBeenCalledWith({
      releaseId,
      cacheDirectory: "/workspace/cache",
      trustFilePath: "/workspace/trust.json",
    });
    expect(deps.generate).toHaveBeenCalledWith(envelope);
    expect(deps.install).toHaveBeenCalledWith({
      outputPath: "/workspace/output",
      force: true,
      contents: {
        tokensJson: '{"schemaVersion":1}\n',
        tokensCss: ":root {}\n",
      },
    });
  });

  it("does not generate after cache verification fails", async () => {
    const deps = {
      ...dependencies(),
      readCache: vi.fn().mockRejectedValue(new Error("cache verification failed")),
    };

    await expect(runGenerate(["--release", releaseId], deps)).rejects.toThrow(
      "cache verification failed",
    );
    expect(deps.generate).not.toHaveBeenCalled();
    expect(deps.install).not.toHaveBeenCalled();
  });

  it("does not transact output after generation fails", async () => {
    const deps = {
      ...dependencies(),
      generate: vi.fn(() => {
        throw new Error("generation failed");
      }),
    };

    await expect(runGenerate(["--release", releaseId], deps)).rejects.toThrow(
      "generation failed",
    );
    expect(deps.install).not.toHaveBeenCalled();
  });

  it("propagates transaction failure without exposing artifact contents", async () => {
    const deps = {
      ...dependencies(),
      install: vi.fn().mockRejectedValue(new Error("disk transaction failed")),
    };

    try {
      await runGenerate(["--release", releaseId], deps);
      throw new Error("Expected transaction failure.");
    } catch (error) {
      expect(String(error)).toContain("disk transaction failed");
      expect(String(error)).not.toContain("schemaVersion");
      expect(String(error)).not.toContain(":root");
    }
  });
});
