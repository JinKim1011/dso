import { CliConfigurationError } from "@repo/cli/errors";

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/gu, "");

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1"
  ) {
    return true;
  }

  const octets = normalized.split(".");

  return (
    octets.length === 4 &&
    octets[0] === "127" &&
    octets.every((octet) => /^(0|[1-9]\d{0,2})$/u.test(octet) && Number(octet) <= 255)
  );
}

export function parseApiUrl(
  value: string | undefined,
  options: { allowLoopbackHttp?: boolean } = {},
): URL {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw new CliConfigurationError();
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new CliConfigurationError();
  }

  const hasAllowedProtocol =
    url.protocol === "https:" ||
    (url.protocol === "http:" &&
      options.allowLoopbackHttp !== false &&
      isLoopbackHostname(url.hostname));

  const hasForbiddenComponents =
    url.username !== "" || url.password !== "" || url.search !== "" || url.hash !== "";

  if (!hasAllowedProtocol || hasForbiddenComponents) {
    throw new CliConfigurationError();
  }

  url.pathname = url.pathname.replace(/\/+$/u, "") || "/";

  return url;
}

export function formatApiBaseUrl(url: URL): string {
  return url.href.endsWith("/") ? url.href.slice(0, -1) : url.href;
}
