import { WorkbenchShell } from "@/_shared/shell/workbench-shell";
import { ThemeProvider } from "@/_shared/theme/theme-provider";
import { loadWorkbenchProject } from "@/features/projects/server/load-workbench-project";
import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { StagedManifestProvider } from "@/features/tokens/state/staged-manifest-context";
import { getDatabasePool } from "@/server/database";
import { getWorkbenchProjectId } from "@/server/workbench-config";
import "@repo/ui/index.css";
import "@xyflow/react/dist/style.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSO : Workbench",
  description: "Visual git for design token management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workbenchProject = await loadWorkbenchProject(
    getDatabasePool(),
    getWorkbenchProjectId(),
  );

  const model = buildTokenGraphViewModel(
    workbenchProject.tokenTypes,
    workbenchProject.tokens,
    workbenchProject.references,
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <StagedManifestProvider baseManifest={model}>
            <WorkbenchShell>{children}</WorkbenchShell>
          </StagedManifestProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
