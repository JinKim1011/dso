import { timingSafeEqual } from "node:crypto";
import { hashApiKey } from "@repo/application/security/api-keys";

export { parseApiKeyCredential } from "@repo/contracts/validation/operations/api-key-credential";

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/i;

export function formatApiKeyCredential(keyIdentifier: string, secret: string): string {
  return `dso_${keyIdentifier}_${secret}`;
}

export function verifyApiKeySecret(storedHash: string, secret: string): boolean {
  if (!SHA256_HEX_PATTERN.test(storedHash)) {
    return false;
  }

  const storedHashBytes = Buffer.from(storedHash, "hex");
  const secretHashBytes = Buffer.from(hashApiKey(secret), "hex");

  if (storedHashBytes.length !== secretHashBytes.length) {
    return false;
  }

  return timingSafeEqual(storedHashBytes, secretHashBytes);
}
