import { createHash, randomBytes } from "node:crypto";

export function generateOpaqueApiKeySecret(): string {
  return randomBytes(32).toString("base64url");
}

export function generateKeyIdentifier(): string {
  return randomBytes(8).toString("hex");
}

export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}
