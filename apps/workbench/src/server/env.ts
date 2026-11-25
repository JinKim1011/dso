export type SecurityEnvironment = {
  databaseUrl: string;
  nodeEnv: "development" | "test" | "production";
  sessionCookieName: string;
};

export type ReleaseSigningEnvironment = {
  keyId: string | undefined;
  privateKey: string | undefined;
};

function loadNodeEnvironment(value: string | undefined): SecurityEnvironment["nodeEnv"] {
  if (value === "production") {
    return "production";
  }

  if (value === "test") {
    return "test";
  }

  if (value === "development" || value === undefined) {
    return "development";
  }

  throw new Error(
    `NODE_ENV must be "development", "test", or "production"; received "${value}".`,
  );
}

export function loadSecurityEnvironment(env: NodeJS.ProcessEnv): SecurityEnvironment {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  return {
    databaseUrl: env.DATABASE_URL,
    nodeEnv: loadNodeEnvironment(env.NODE_ENV),
    sessionCookieName: env.SESSION_COOKIE_NAME ?? "dso_session",
  };
}

export function isWorkbenchAuthenticationEnabled(env: NodeJS.ProcessEnv): boolean {
  return (
    env.NODE_ENV === "development" ||
    (env.NODE_ENV === "production" && env.DSO_WORKBENCH_AUTH_ENABLED === "true")
  );
}

export function loadReleaseSigningEnvironment(
  env: NodeJS.ProcessEnv,
): ReleaseSigningEnvironment {
  return {
    keyId: env.DSO_RELEASE_SIGNING_KEY_ID,
    privateKey: env.DSO_RELEASE_SIGNING_PRIVATE_KEY,
  };
}
