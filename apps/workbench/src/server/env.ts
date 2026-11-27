export type SecurityEnvironment = {
  databaseUrl: string;
  nodeEnv: "development" | "test" | "production";
  sessionCookieName: string;
};

export type ReleaseSigningEnvironment = {
  keyId: string | undefined;
  privateKey: string | undefined;
};

export type WorkbenchFeatureEnvironment = {
  publishEnabled: boolean;
  apiKeyManagementEnabled: boolean;
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

function loadExplicitFeatureFlag(
  env: NodeJS.ProcessEnv,
  name: string,
): boolean {
  const value = env[name];

  if (value === undefined || value === "false") {
    return false;
  }

  if (value === "true") {
    return true;
  }

  throw new Error(`${name} must be "true" or "false".`);
}

export function loadWorkbenchFeatureEnvironment(
  env: NodeJS.ProcessEnv,
): WorkbenchFeatureEnvironment {
  if (env.NODE_ENV === "development") {
    return {
      publishEnabled: true,
      apiKeyManagementEnabled: true,
    };
  }

  return {
    publishEnabled: loadExplicitFeatureFlag(env, "DSO_PUBLISH_ENABLED"),
    apiKeyManagementEnabled: loadExplicitFeatureFlag(
      env,
      "DSO_API_KEY_MANAGEMENT_ENABLED",
    ),
  };
}

export function isPublishEnabled(env: NodeJS.ProcessEnv): boolean {
  return loadWorkbenchFeatureEnvironment(env).publishEnabled;
}

export function isApiKeyManagementEnabled(env: NodeJS.ProcessEnv): boolean {
  return loadWorkbenchFeatureEnvironment(env).apiKeyManagementEnabled;
}

export function loadReleaseSigningEnvironment(
  env: NodeJS.ProcessEnv,
): ReleaseSigningEnvironment {
  return {
    keyId: env.DSO_RELEASE_SIGNING_KEY_ID,
    privateKey: env.DSO_RELEASE_SIGNING_PRIVATE_KEY,
  };
}
