import { readVerifiedReleaseCache } from "@repo/cli/cache/read-release-cache";
import {
  loadGenerateConfiguration,
  type GenerateConfiguration,
} from "@repo/cli/config/generate-environment";
import { parseGenerateArguments } from "@repo/cli/options/generate-options";
import {
  installGeneratedArtifacts,
  type GeneratedArtifactContents,
} from "@repo/cli/output/atomic-artifacts";
import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { generateTokenArtifacts } from "@repo/generator/generator";

export type GenerateDependencies = Readonly<{
  loadConfiguration: (overrides: {
    outputPath?: string;
    trustFilePath?: string;
    cachePath?: string;
  }) => GenerateConfiguration;

  readCache: (options: {
    cacheDirectory: string;
    releaseId: string;
    trustFilePath: string;
  }) => Promise<SignedPublishedReleaseResponse>;

  generate: (release: SignedPublishedReleaseResponse) => GeneratedArtifactContents;

  install: (options: {
    outputPath: string;
    force: boolean;
    contents: GeneratedArtifactContents;
  }) => Promise<void>;
}>;

const defaultDependencies: GenerateDependencies = {
  loadConfiguration: (overrides) => loadGenerateConfiguration(process.env, overrides),
  readCache: readVerifiedReleaseCache,
  generate: generateTokenArtifacts,
  install: installGeneratedArtifacts,
};

export async function runGenerate(
  args: readonly string[],
  dependencies: GenerateDependencies = defaultDependencies,
): Promise<string> {
  const options = parseGenerateArguments(args);
  const configuration = dependencies.loadConfiguration({
    outputPath: options.output,
    trustFilePath: options.trustFile,
    cachePath: options.cacheDirectory,
  });

  const envelope = await dependencies.readCache({
    cacheDirectory: configuration.cachePath,
    releaseId: options.releaseId,
    trustFilePath: configuration.trustFilePath,
  });
  const artifacts = dependencies.generate(envelope);

  await dependencies.install({
    outputPath: configuration.outputPath,
    force: options.force,
    contents: artifacts,
  });

  return configuration.outputPath;
}
