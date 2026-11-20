import type {
  PublishedReleaseResponse,
  ReleaseSignature,
  SignedPublishedReleaseResponse,
} from "@repo/contracts/operation";
import { parseSignature } from "@repo/release-protocol/envelope-fields";
import { parseEnvelope } from "@repo/release-protocol/envelope-parser";
import type { ReleasePrivateKey } from "@repo/release-protocol/keys";
import { signRelease } from "@repo/release-protocol/sign";

type CreateSignedReleaseEnvelopeOptions =
  | {
      signature: ReleaseSignature;
    }
  | {
      privateKey: ReleasePrivateKey;
      keyId: string;
    };

export function parseSignedReleaseEnvelope(
  input: unknown,
): SignedPublishedReleaseResponse {
  return parseEnvelope(input);
}

export function createSignedReleaseEnvelope(
  release: PublishedReleaseResponse,
  options: CreateSignedReleaseEnvelopeOptions,
): SignedPublishedReleaseResponse {
  const signature =
    "signature" in options
      ? parseSignature(options.signature)
      : signRelease(release, options.privateKey, options.keyId);

  return parseSignedReleaseEnvelope({ ...release, signature });
}
