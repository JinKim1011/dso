import {
  loadReleaseSigningConfiguration,
  ReleaseSigningConfigurationError,
} from "@/server/release-signing-config";
import { generateKeyPairSync, type KeyObject } from "node:crypto";
import { describe, expect, it } from "vitest";

function privateKeyPem(key: KeyObject): string {
  return key.export({ format: "pem", type: "pkcs8" }).toString();
}

function validEnvironment(privateKey: KeyObject): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    DSO_RELEASE_SIGNING_KEY_ID: "release-key-2026-01",
    DSO_RELEASE_SIGNING_PRIVATE_KEY: privateKeyPem(privateKey),
  };
}

describe("release signing configuration", () => {
  it("loads an Ed25519 private key and key ID", () => {
    const keyPair = generateKeyPairSync("ed25519");
    const configuration = loadReleaseSigningConfiguration(
      validEnvironment(keyPair.privateKey),
    );

    expect(configuration.keyId).toBe("release-key-2026-01");
    expect(configuration.privateKey.type).toBe("private");
    expect(configuration.privateKey.asymmetricKeyType).toBe("ed25519");
    expect(configuration).not.toHaveProperty("DSO_RELEASE_SIGNING_PRIVATE_KEY");
  });

  it("accepts escaped PEM newlines used by environment variables", () => {
    const keyPair = generateKeyPairSync("ed25519");
    const env = validEnvironment(keyPair.privateKey);
    env.DSO_RELEASE_SIGNING_PRIVATE_KEY = env.DSO_RELEASE_SIGNING_PRIVATE_KEY?.replaceAll(
      "\n",
      "\\n",
    );

    expect(() => loadReleaseSigningConfiguration(env)).not.toThrow();
  });

  it.each([
    undefined,
    "",
    " key-with-space",
    "key with space",
    "key/with/slash",
    "k".repeat(129),
  ])("rejects a missing or invalid key ID: %s", (keyId) => {
    const keyPair = generateKeyPairSync("ed25519");
    const env = validEnvironment(keyPair.privateKey);
    env.DSO_RELEASE_SIGNING_KEY_ID = keyId;

    expect(() => loadReleaseSigningConfiguration(env)).toThrow(
      ReleaseSigningConfigurationError,
    );
  });

  it.each([undefined, "", "not a PEM key"])(
    "rejects a missing or malformed private key without exposing it: %s",
    (privateKey) => {
      const env: NodeJS.ProcessEnv = {
        NODE_ENV: "test",
        DSO_RELEASE_SIGNING_KEY_ID: "release-key-2026-01",
        DSO_RELEASE_SIGNING_PRIVATE_KEY: privateKey,
      };

      try {
        loadReleaseSigningConfiguration(env);
        throw new Error("Expected signing configuration to fail.");
      } catch (error) {
        expect(error).toBeInstanceOf(ReleaseSigningConfigurationError);
        expect((error as Error).message).toBe(
          "Release signing is not configured correctly.",
        );
        if (privateKey) {
          expect((error as Error).message).not.toContain(privateKey);
        }
      }
    },
  );

  it("rejects non-Ed25519 private keys", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const env = validEnvironment(privateKey);

    expect(() => loadReleaseSigningConfiguration(env)).toThrow(
      ReleaseSigningConfigurationError,
    );
  });

  it("rejects public keys", () => {
    const { publicKey } = generateKeyPairSync("ed25519");
    const publicPem = publicKey.export({
      format: "pem",
      type: "spki",
    });
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      DSO_RELEASE_SIGNING_KEY_ID: "release-key-2026-01",
      DSO_RELEASE_SIGNING_PRIVATE_KEY: publicPem.toString(),
    };

    expect(() => loadReleaseSigningConfiguration(env)).toThrow(
      ReleaseSigningConfigurationError,
    );
  });
});
