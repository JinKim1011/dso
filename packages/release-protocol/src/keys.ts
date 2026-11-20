import { createPrivateKey, createPublicKey, KeyObject } from "node:crypto";

export type ReleasePrivateKey = KeyObject | string | Buffer;

export function toEd25519PrivateKey(key: ReleasePrivateKey): KeyObject {
  if (key instanceof KeyObject && key.type !== "private") {
    throw new TypeError("Release signing requires a private key.");
  }

  const privateKey = key instanceof KeyObject ? key : createPrivateKey(key);

  if (privateKey.asymmetricKeyType !== "ed25519" || privateKey.type !== "private") {
    throw new TypeError("Release signing requires an Ed25519 private key.");
  }

  return privateKey;
}

export type ReleasePublicKey = KeyObject | string | Buffer;

export function toEd25519PublicKey(key: ReleasePublicKey): KeyObject {
  if (key instanceof KeyObject && key.type !== "public") {
    throw new TypeError("Release verification requires a public key.");
  }

  if (typeof key !== "object" && key.toString().includes("PRIVATE KEY")) {
    throw new TypeError("Release verification requires a public key.");
  }

  if (key instanceof Buffer && key.toString().includes("PRIVATE KEY")) {
    throw new TypeError("Release verification requires a public key.");
  }

  const publicKey = key instanceof KeyObject ? key : createPublicKey(key);

  if (publicKey.asymmetricKeyType !== "ed25519") {
    throw new TypeError("Release verification requires an Ed25519 public key.");
  }

  return publicKey;
}

export type TrustedReleaseKeys =
  Readonly<Record<string, ReleasePublicKey>> | ReadonlyMap<string, ReleasePublicKey>;

export function findTrustedPublicKey(
  trustedKeys: TrustedReleaseKeys,
  keyId: string,
): ReleasePublicKey | undefined {
  if (trustedKeys instanceof Map) {
    return trustedKeys.get(keyId);
  }

  const trustedKeyRecord = trustedKeys as Readonly<Record<string, ReleasePublicKey>>;

  if (!Object.hasOwn(trustedKeyRecord, keyId)) {
    return undefined;
  }
  return trustedKeyRecord[keyId];
}
