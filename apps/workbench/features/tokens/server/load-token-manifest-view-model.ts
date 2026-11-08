import "server-only";

import { buildTokenGraphViewModel } from "@/features/tokens/adapters/manifest/from-manifest";
import fs from "node:fs/promises";
import path from "node:path";

export async function loadTokenManifestViewModel() {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const defaultManifest = path.join(repoRoot, "design-tokens-manifest.json");

  const rawManifestPath = process.env.DSO_MANIFEST_PATH;
  const manifestPath = rawManifestPath
    ? path.isAbsolute(rawManifestPath)
      ? rawManifestPath
      : path.join(repoRoot, rawManifestPath)
    : defaultManifest;

  let manifest: unknown;

  try {
    const content = await fs.readFile(manifestPath, "utf-8");
    manifest = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to load design tokens manifest from ${manifestPath}: ${String(error)}`,
    );
  }

  return buildTokenGraphViewModel(manifest).viewModel;
}
