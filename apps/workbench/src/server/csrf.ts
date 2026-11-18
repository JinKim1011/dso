function getTrustedMutationOrigin(env: NodeJS.ProcessEnv): string {
  const configured = env.DSO_WORKBENCH_ORIGIN;
  if (!configured) {
    throw new Error("DSO_WORKBENCH_ORIGIN is required for mutation requests.");
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw new Error("DSO_WORKBENCH_ORIGIN must be an HTTP(S) origin.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    configured !== url.origin
  ) {
    throw new Error("DSO_WORKBENCH_ORIGIN must be an HTTP(S) origin without a path.");
  }

  return url.origin;
}

export function isTrustedMutationRequest(
  request: Request,
  env: NodeJS.ProcessEnv,
): boolean {
  const origin = getTrustedMutationOrigin(env);

  const fetchSite = request.headers.get("sec-fetch-site");

  return (
    request.headers.get("origin") === origin &&
    request.headers.get("x-dso-csrf") === "1" &&
    (fetchSite === null || fetchSite === "same-origin")
  );
}
