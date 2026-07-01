import fs from "fs/promises";
import path from "path";
import { type ReactNode } from "react";
import { buildTokenGraphModel } from "../../tokens/lib/manifestAdapter";
import { StagedManifestProvider } from "../context/StagedManifestContext";
import { Footer } from "./Footer";
import { Header } from "./Header";

type WorkbenchShellProps = {
  children: ReactNode;
};

export async function WorkbenchShell({ children }: WorkbenchShellProps) {
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
    const manifestText = await fs.readFile(manifestPath, "utf-8");
    manifest = JSON.parse(manifestText);
  } catch (error) {
    throw new Error(
      `Failed to load design tokens manifest from ${manifestPath}: ${String(error)}`,
    );
  }

  const result = buildTokenGraphModel(manifest);

  return (
    <StagedManifestProvider baseManifest={result.model}>
      <div className="flex h-screen flex-col">
        <Header />
        <main className="mx-mini rounded-mini border-stroke-secondary flex-1 overflow-hidden border">
          {children}
        </main>
        <Footer />
      </div>
    </StagedManifestProvider>
  );
}
