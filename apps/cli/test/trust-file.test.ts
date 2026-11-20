import { loadReleaseTrustFile } from "@repo/cli/config/trust-file";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const directories: string[] = [];

async function trustFile(contents: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "dso-trust-"));
  directories.push(directory);
  const path = join(directory, "trust.json");
  await writeFile(path, contents);
  return path;
}

function publicPem() {
  return generateKeyPairSync("ed25519")
    .publicKey.export({ format: "pem", type: "spki" })
    .toString();
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("release trust file", () => {
  it("loads multiple Ed25519 key IDs", async () => {
    const path = await trustFile(
      JSON.stringify({
        keys: {
          "release-key-2026-01": publicPem(),
          "release-key-2026-02": publicPem(),
        },
      }),
    );

    const trusted = await loadReleaseTrustFile(path);
    expect([...trusted.keys()]).toEqual(["release-key-2026-01", "release-key-2026-02"]);
    expect(
      [...trusted.values()].every(
        (key) => key.asymmetricKeyType === "ed25519" && key.type === "public",
      ),
    ).toBe(true);
  });

  it("rejects empty and duplicate key IDs", async () => {
    const pem = JSON.stringify(publicPem());
    const empty = await trustFile(JSON.stringify({ keys: { "": publicPem() } }));
    const duplicate = await trustFile(`{"keys":{"key-1":${pem},"key-1":${pem}}}`);

    await expect(loadReleaseTrustFile(empty)).rejects.toThrow();
    await expect(loadReleaseTrustFile(duplicate)).rejects.toThrow();
  });

  it("rejects an empty trust key collection", async () => {
    const path = await trustFile(JSON.stringify({ keys: {} }));

    await expect(loadReleaseTrustFile(path)).rejects.toThrow();
  });

  it("rejects private keys, malformed PEM, and non-Ed25519 public keys", async () => {
    const ed25519 = generateKeyPairSync("ed25519");
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateKey = ed25519.privateKey
      .export({ format: "pem", type: "pkcs8" })
      .toString();
    const rsaKey = rsa.publicKey.export({ format: "pem", type: "spki" }).toString();

    for (const value of [privateKey, "not a PEM key", rsaKey]) {
      const path = await trustFile(JSON.stringify({ keys: { "key-1": value } }));
      await expect(loadReleaseTrustFile(path)).rejects.toThrow();
    }
  });

  it("does not treat an unknown key ID as trusted", async () => {
    const path = await trustFile(JSON.stringify({ keys: { "key-1": publicPem() } }));

    expect((await loadReleaseTrustFile(path)).get("unknown-key")).toBeUndefined();
  });
});
