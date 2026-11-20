import type {
  PublishedReleaseResponse,
  ReleaseSignature,
} from "@repo/contracts/operation";
import { canonicalizeRelease } from "@repo/release-protocol/canonicalize";
import { type ReleasePrivateKey, toEd25519PrivateKey } from "@repo/release-protocol/keys";
import { assertKeyId } from "@repo/release-protocol/limits";
import { sign } from "node:crypto";

export function signRelease(
  release: PublishedReleaseResponse,
  privateKey: ReleasePrivateKey,
  keyId: string,
): ReleaseSignature {
  assertKeyId(keyId);

  const signature = sign(
    null,
    Buffer.from(canonicalizeRelease(release), "utf8"),
    toEd25519PrivateKey(privateKey),
  );

  return {
    algorithm: "Ed25519",
    keyId,
    value: signature.toString("base64url"),
  };
}
