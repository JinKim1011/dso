import { formatApiBaseUrl, parseApiUrl } from "@repo/cli/config/api-url";
import {
  defaultCachePath,
  defaultTrustFilePath,
  resolvePath,
} from "@repo/cli/config/path";
import { CliConfigurationError } from "@repo/cli/errors";

export type CliConfiguration = Readonly<{
  apiKey: string;
  apiBaseUrl: string;
  trustFilePath: string;
  cachePath: string;
}>;

function requireApiKey(value: string | undefined): string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    throw new CliConfigurationError();
  }

  return value;
}

export function loadCliConfiguration(
  env: NodeJS.ProcessEnv = process.env,
  options: { cwd?: string; home?: string } = {},
): CliConfiguration {
  const trustFilePath = env.DSO_RELEASE_TRUST_FILE
    ? resolvePath(env.DSO_RELEASE_TRUST_FILE, options.cwd)
    : defaultTrustFilePath(env, options.home);

  return {
    apiKey: requireApiKey(env.DSO_API_KEY),
    apiBaseUrl: formatApiBaseUrl(
      parseApiUrl(env.DSO_API_URL, {
        allowLoopbackHttp: env.NODE_ENV !== "production",
      }),
    ),
    trustFilePath,
    cachePath: defaultCachePath(env, options.home),
  };
}
