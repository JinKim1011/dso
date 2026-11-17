import type { SaveStagedChangesRequest } from "@repo/contracts/operation";
import { createHash } from "node:crypto";

export function hashRequest(request: SaveStagedChangesRequest): string {
  const canonical = JSON.stringify(request, (_key, value: unknown) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    }

    return value;
  });

  return createHash("sha256").update(canonical).digest("hex");
}
