import type { PublishedReleaseResponse } from "@repo/contracts/operation";
import { createSignedReleaseEnvelope } from "@repo/release-protocol/envelope";
import { signRelease } from "@repo/release-protocol/sign";
import { verifyRelease } from "@repo/release-protocol/verify";
import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";

const release: PublishedReleaseResponse = {
  schemaVersion: 1,
  release: {
    id: "release-1",
    projectId: "project-1",
    version: "1",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    publishedAt: "2026-01-01T00:00:00.000Z",
  },
  tokenTypes: [],
  tokens: [],
  references: [],
  components: [],
  templates: [],
};

function keys() {
  return generateKeyPairSync("ed25519");
}

describe("release signing", () => {
  it("signs and verifies with PEM and KeyObject Ed25519 keys", () => {
    const keyPair = keys();
    const privatePem = keyPair.privateKey.export({
      format: "pem",
      type: "pkcs8",
    });
    const publicPem = keyPair.publicKey.export({
      format: "pem",
      type: "spki",
    });
    const pemSignature = signRelease(release, privatePem, "key-1");
    const objectSignature = signRelease(release, keyPair.privateKey, "key-1");

    expect(pemSignature.value).toMatch(/^[A-Za-z0-9_-]{86}$/u);
    expect(objectSignature).toEqual(pemSignature);
    expect(
      verifyRelease(createSignedReleaseEnvelope(release, { signature: pemSignature }), {
        "key-1": publicPem,
      }),
    ).toBe(true);
    expect(
      verifyRelease(
        createSignedReleaseEnvelope(release, { signature: pemSignature }),
        new Map([["key-1", keyPair.publicKey]]),
      ),
    ).toBe(true);
  });

  it("rejects a modified payload", () => {
    const keyPair = keys();
    const envelope = createSignedReleaseEnvelope(release, {
      privateKey: keyPair.privateKey,
      keyId: "key-1",
    });
    const modified = {
      ...envelope,
      release: { ...envelope.release, version: "2" },
    };

    expect(verifyRelease(modified, { "key-1": keyPair.publicKey })).toBe(false);
  });

  it("rejects a changed signature", () => {
    const keyPair = keys();
    const envelope = createSignedReleaseEnvelope(release, {
      privateKey: keyPair.privateKey,
      keyId: "key-1",
    });
    const changed = {
      ...envelope,
      signature: {
        ...envelope.signature,
        value: `${envelope.signature.value[0] === "A" ? "B" : "A"}${envelope.signature.value.slice(1)}`,
      },
    };

    expect(verifyRelease(changed, { "key-1": keyPair.publicKey })).toBe(false);
  });

  it("fails closed for unsupported algorithms and unknown key IDs", () => {
    const keyPair = keys();
    const envelope = createSignedReleaseEnvelope(release, {
      privateKey: keyPair.privateKey,
      keyId: "key-1",
    });
    const unsupported = {
      ...envelope,
      signature: {
        ...envelope.signature,
        algorithm: "RSA-SHA256",
      },
    } as unknown as Parameters<typeof verifyRelease>[0];

    expect(
      verifyRelease(unsupported, {
        "key-1": keyPair.publicKey,
      }),
    ).toBe(false);
    expect(
      verifyRelease(envelope, {
        "unknown-key": keyPair.publicKey,
      }),
    ).toBe(false);
  });

  it("rejects a valid signature checked with another key pair", () => {
    const signer = keys();
    const other = keys();
    const envelope = createSignedReleaseEnvelope(release, {
      privateKey: signer.privateKey,
      keyId: "key-1",
    });

    expect(
      verifyRelease(envelope, {
        "key-1": other.publicKey,
      }),
    ).toBe(false);
  });

  it.each([
    ["standard base64", "+".repeat(86)],
    ["padding", `${"A".repeat(86)}=`],
    ["short value", "short"],
    ["non-canonical encoding", `${"A".repeat(85)}!`],
  ])("rejects invalid base64url signatures: %s", (_name, value) => {
    const keyPair = keys();
    const envelope = createSignedReleaseEnvelope(release, {
      privateKey: keyPair.privateKey,
      keyId: "key-1",
    });

    expect(
      verifyRelease(
        {
          ...envelope,
          signature: { ...envelope.signature, value },
        },
        { "key-1": keyPair.publicKey },
      ),
    ).toBe(false);
  });

  it("rejects a public signing key and a private verification key", () => {
    const keyPair = keys();
    const privatePem = keyPair.privateKey.export({
      format: "pem",
      type: "pkcs8",
    });
    const publicPem = keyPair.publicKey.export({
      format: "pem",
      type: "spki",
    });

    expect(() => signRelease(release, keyPair.publicKey, "key-1")).toThrow(TypeError);
    const envelope = createSignedReleaseEnvelope(release, {
      privateKey: keyPair.privateKey,
      keyId: "key-1",
    });
    expect(
      verifyRelease(envelope, {
        "key-1": privatePem,
      }),
    ).toBe(false);
    expect(() => signRelease(release, publicPem, "key-1")).toThrow();
  });

  it("rejects non-Ed25519 keys", () => {
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const ed25519 = keys();
    const envelope = createSignedReleaseEnvelope(release, {
      privateKey: ed25519.privateKey,
      keyId: "key-1",
    });

    expect(() => signRelease(release, rsa.privateKey, "key-1")).toThrow(TypeError);
    expect(
      verifyRelease(envelope, {
        "key-1": rsa.publicKey,
      }),
    ).toBe(false);
  });
});
