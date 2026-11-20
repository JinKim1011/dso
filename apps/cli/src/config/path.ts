import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

export function resolvePath(value: string, cwd = process.cwd()): string {
  const expanded =
    value === "~" || value.startsWith("~/") || value.startsWith("~\\")
      ? join(homedir(), value.slice(2))
      : value;

  return isAbsolute(expanded) ? resolve(expanded) : resolve(cwd, expanded);
}

export function defaultTrustFilePath(
  env: NodeJS.ProcessEnv = process.env,
  home = homedir(),
): string {
  if (process.platform === "darwin") {
    return join(home, "Library", "Application Support", "dso", "trust.json");
  }

  return join(env.XDG_CONFIG_HOME ?? join(home, ".config"), "dso", "trust.json");
}

export function defaultCachePath(
  env: NodeJS.ProcessEnv = process.env,
  home = homedir(),
): string {
  if (process.platform === "darwin") {
    return join(home, "Library", "Caches", "dso");
  }

  return join(env.XDG_CACHE_HOME ?? join(home, ".cache"), "dso");
}
