import { loadReleaseSigningConfiguration } from "@/server/release-signing-config";

try {
  loadReleaseSigningConfiguration(process.env);

  console.log("Release signing environment verified.");
} catch {
  console.error(
    "Release signing environment is invalid. Check DSO_RELEASE_SIGNING_KEY_ID and DSO_RELEASE_SIGNING_PRIVATE_KEY.",
  );

  process.exitCode = 1;
}
