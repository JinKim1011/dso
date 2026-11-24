import {
  defaultCachePath,
  defaultTrustFilePath,
  resolvePath,
} from "@repo/cli/config/path";

export type GenerateConfiguration = Readonly<{
  outputPath: string;
  trustFilePath: string;
  cachePath: string;
}>;

export function loadGenerateConfiguration(
  env: NodeJS.ProcessEnv = process.env,
  options: {
    cwd?: string;
    home?: string;
    outputPath?: string;
    trustFilePath?: string;
    cachePath?: string;
  } = {},
): GenerateConfiguration {
  const cwd = options.cwd ?? process.cwd();
  const trustFilePathValue = options.trustFilePath ?? env.DSO_RELEASE_TRUST_FILE;

  return {
    outputPath: resolvePath(options.outputPath ?? ".", cwd),
    trustFilePath: trustFilePathValue
      ? resolvePath(trustFilePathValue, cwd)
      : defaultTrustFilePath(env, options.home),
    cachePath: options.cachePath
      ? resolvePath(options.cachePath, cwd)
      : defaultCachePath(env, options.home),
  };
}
