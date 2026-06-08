import fs from "fs/promises";
import path from "path";
import { type ReactNode } from "react";
import { buildTokenGraphModel } from "../../tokens/_shared/lib/manifestAdapter";
import NavigationSlotProvider from "../context/NavigationSlotContext";
import { StagedManifestProvider } from "../context/StagedManifestContext";
import { Header } from "./Header";
import { Navigation } from "./Navigation";

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

  const currentBranch =
    process.env.NEXT_PUBLIC_WORKBENCH_CURRENT_BRANCH ?? "style/add-color-design-tokens";
  const userName = process.env.NEXT_PUBLIC_WORKBENCH_USER_NAME ?? "jin1011";

  return (
    <NavigationSlotProvider>
      <StagedManifestProvider baseManifest={result.model}>
        <div>
          <Header currentBranch={currentBranch} userName={userName}></Header>
          <Navigation />
          <main>{children}</main>
        </div>
      </StagedManifestProvider>
    </NavigationSlotProvider>
  );
}
