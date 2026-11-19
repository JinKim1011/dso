import type { SignedPublishedReleaseResponse } from "@repo/contracts/operation";
import { canonicalizeRelease } from "@repo/release-protocol/canonicalize";
import {
  findTrustedPublicKey,
  toEd25519PublicKey,
  type TrustedReleaseKeys,
} from "@repo/release-protocol/keys";
import { assertKeyId, assertSignatureValue } from "@repo/release-protocol/limits";
import { verify } from "node:crypto";

export function verifyRelease(
  envelope: SignedPublishedReleaseResponse,
  trustedKeys: TrustedReleaseKeys,
): boolean {
  const { signature, ...release } = envelope;

  if (
    !signature ||
    signature.algorithm !== "Ed25519" ||
    typeof signature.keyId !== "string" ||
    typeof signature.value !== "string"
  ) {
    return false;
  }

  try {
    assertKeyId(signature.keyId);

    assertSignatureValue(signature.value);

    const trustedPublicKey = findTrustedPublicKey(trustedKeys, signature.keyId);
    if (!trustedPublicKey) {
      return false;
    }

    return verify(
      null,
      Buffer.from(canonicalizeRelease(release), "utf8"),
      toEd25519PublicKey(trustedPublicKey),
      Buffer.from(signature.value, "base64url"),
    );
  } catch {
    return false;
  }
}
