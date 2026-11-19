export const MAX_RELEASE_BYTES = 5 * 1024 * 1024;
export const MAX_RELEASE_KEY_ID_BYTES = 128;
export const ED25519_SIGNATURE_BYTES = 64;
export const ED25519_SIGNATURE_BASE64URL_LENGTH = 86;

export function assertReleaseSize(serialized: string): void {
  if (Buffer.byteLength(serialized, "utf8") > MAX_RELEASE_BYTES) {
    throw new RangeError(
      `Canonical release exceeds the ${MAX_RELEASE_BYTES}-byte limit.`,
    );
  }
}

export function assertKeyId(keyId: string): void {
  if (
    keyId.length === 0 ||
    Buffer.byteLength(keyId, "utf8") > MAX_RELEASE_KEY_ID_BYTES ||
    /[\u0000-\u001f\u007f]/u.test(keyId)
  ) {
    throw new TypeError("Release signature keyId is invalid.");
  }
}

export function assertSignatureValue(value: string): void {
  if (
    value.length !== ED25519_SIGNATURE_BASE64URL_LENGTH ||
    !/^[A-Za-z0-9_-]+$/u.test(value)
  ) {
    throw new TypeError("Release signature value must be unpadded base64url.");
  }

  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.length !== ED25519_SIGNATURE_BYTES ||
    decoded.toString("base64url") !== value
  ) {
    throw new TypeError("Release signature is not a 64-byte Ed25519 signature.");
  }
}
