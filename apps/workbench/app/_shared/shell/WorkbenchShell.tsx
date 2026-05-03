"use client";

import { type ReactNode } from "react";
import designTokensManifest from "../../../../../design-tokens-manifest.json";
import { buildTokenGraphModel } from "../../tokens/lib/manifestAdapter";
import { StagedManifestProvider } from "../context/StagedManifestContext";
import WorkbenchShellProvider from "../context/WorkbenchShellContext";
import { Header } from "./Header";
import { Navigation } from "./Navigation";

type WorkbenchShellProps = {
  children: ReactNode;
};
const result = buildTokenGraphModel(designTokensManifest);

export function WorkbenchShell({ children }: WorkbenchShellProps) {
  const currentBranch =
    process.env.NEXT_PUBLIC_WORKBENCH_CURRENT_BRANCH ?? "style/add-color-design-tokens";
  const userName = process.env.NEXT_PUBLIC_WORKBENCH_USER_NAME ?? "jin1011";

  return (
    <WorkbenchShellProvider>
      <StagedManifestProvider baseManifest={result.model}>
        <div>
          <Header currentBranch={currentBranch} userName={userName}></Header>
          <Navigation />
          <main>{children}</main>
        </div>
      </StagedManifestProvider>
    </WorkbenchShellProvider>
  );
}
