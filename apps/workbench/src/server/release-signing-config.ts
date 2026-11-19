import { loadReleaseSigningEnvironment } from "@/server/env";
import { toEd25519PrivateKey } from "@repo/release-protocol/keys";
import type { KeyObject } from "node:crypto";

const RELEASE_SIGNING_KEY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

export type ReleaseSigningConfiguration = Readonly<{
  keyId: string;
  privateKey: KeyObject;
}>;

export class ReleaseSigningConfigurationError extends Error {
  constructor() {
    super("Release signing is not configured correctly.");
    this.name = "ReleaseSigningConfigurationError";
  }
}

function loadKeyId(keyId: string | undefined): string {
  if (
    typeof keyId !== "string" ||
    !RELEASE_SIGNING_KEY_ID_PATTERN.test(keyId) ||
    keyId !== keyId.trim()
  ) {
    throw new ReleaseSigningConfigurationError();
  }

  return keyId;
}

function loadPrivateKey(encodedPrivateKey: string | undefined): KeyObject {
  if (typeof encodedPrivateKey !== "string" || encodedPrivateKey.length === 0) {
    throw new ReleaseSigningConfigurationError();
  }

  try {
    const pem = encodedPrivateKey.includes("\\n")
      ? encodedPrivateKey.replaceAll("\\n", "\n")
      : encodedPrivateKey;

    return toEd25519PrivateKey(pem);
  } catch {
    throw new ReleaseSigningConfigurationError();
  }
}

export function loadReleaseSigningConfiguration(
  env: NodeJS.ProcessEnv,
): ReleaseSigningConfiguration {
  const signingEnvironment = loadReleaseSigningEnvironment(env);

  return {
    keyId: loadKeyId(signingEnvironment.keyId),
    privateKey: loadPrivateKey(signingEnvironment.privateKey),
  };
}
