import { loadSecurityEnvironment } from "@/server/env";
import {
  loadReleaseSigningConfiguration,
  type ReleaseSigningConfiguration,
} from "@/server/release-signing-config";

export const securityEnvironment = loadSecurityEnvironment(process.env);

let cachedReleaseSigningConfiguration: ReleaseSigningConfiguration | undefined;

export function getReleaseSigningConfiguration(): ReleaseSigningConfiguration {
  cachedReleaseSigningConfiguration ??= loadReleaseSigningConfiguration(process.env);
  return cachedReleaseSigningConfiguration;
}
