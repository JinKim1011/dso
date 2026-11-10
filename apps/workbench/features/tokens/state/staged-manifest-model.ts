import { buildManifestFromGraph } from "@/features/tokens/adapters/manifest/to-manifest";
import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";
import { diffLines } from "diff";

type ManifestLineChangeStats = {
  addedLines: number;
  deletedLines: number;
};

export function getManifestLineChangeStats(
  baseModel: TokenGraphViewModel,
  draftModel: TokenGraphViewModel,
): ManifestLineChangeStats {
  const baseManifest = buildManifestFromGraph(baseModel);
  const draftManifest = buildManifestFromGraph(draftModel);

  const baseContent = JSON.stringify(baseManifest, null, 2);
  const draftContent = JSON.stringify(draftManifest, null, 2);

  const diff = diffLines(baseContent, draftContent);
  let addedLines = 0;
  let deletedLines = 0;

  for (const part of diff) {
    if (part.added) {
      addedLines += part.count ?? 0;
    }

    if (part.removed) {
      deletedLines += part.count ?? 0;
    }
  }

  return { addedLines, deletedLines };
}
