import fs from "fs/promises";
import path from "path";
import { type ReactNode } from "react";
import { buildTokenGraphModel } from "../../tokens/lib/manifestAdapter";
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
  const manifestPath = process.env.DSO_MANIFEST_PATH
    ? path.resolve(process.cwd(), process.env.DSO_MANIFEST_PATH)
    : defaultManifest;

  const manifestText = await fs.readFile(manifestPath, "utf-8");
  const manifest = JSON.parse(manifestText);
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
