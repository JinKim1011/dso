import { CliUsageError } from "@repo/cli/errors";
import { validateUuidField } from "@repo/contracts/validation/operations/common";
import { join, resolve } from "node:path";

export function requireReleaseId(value: string): string {
  if (validateUuidField(value, "releaseId")) {
    throw new CliUsageError("releaseId must be a UUID.");
  }

  return value;
}

export function releaseCachePath(cacheDirectory: string, releaseId: string): string {
  return join(resolve(cacheDirectory), `${requireReleaseId(releaseId)}.json`);
}
