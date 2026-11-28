import { generateKeyPairSync } from "node:crypto";

const keyId = process.argv[2];

if (!keyId || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(keyId)) {
  console.error(
    "Usage: npm run signing:generate -- <release-key-id>. The key ID must contain 1-128 safe identifier characters.",
  );

  process.exitCode = 1;
} else {
  const keyPair = generateKeyPairSync("ed25519");

  const privateKey = keyPair.privateKey
    .export({ format: "pem", type: "pkcs8" })
    .toString();
  const publicKey = keyPair.publicKey.export({ format: "pem", type: "spki" }).toString();

  console.log("DSO_RELEASE_SIGNING_PRIVATE_KEY");
  console.log(privateKey.replaceAll("\n", "\\n"));
  console.log();
  console.log("DSO_RELEASE_TRUST_FILE_CONTENT");
  console.log(JSON.stringify({ keys: { [keyId]: publicKey } }, null, 2));
}
