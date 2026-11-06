import type { NormalizedManifestEntry } from "@/features/tokens/adapters/manifest/types";
import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";

export function buildManifestFromGraph(
  model: TokenGraphViewModel,
): NormalizedManifestEntry[] {
  const entries: NormalizedManifestEntry[] = [];

  for (const tokenType of model.tokenTypes) {
    entries.push({
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      value: tokenType.values.map((value) => value.value as string),
      tokens: tokenType.values.map((value) => ({
        name: value.name,
        cssVar: value.cssVar,
        value: value.value as string,
        status: value.status,
      })),
    });
  }

  return entries;
}
