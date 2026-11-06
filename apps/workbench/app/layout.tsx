import { WorkbenchShell } from "@/_shared/shell/workbench-shell";
import { ThemeInitializer } from "@/_shared/theme/theme-initializer";
import { loadTokenManifestViewModel } from "@/features/tokens/server/load-token-manifest-view-model";
import { StagedManifestProvider } from "@/features/tokens/state/staged-manifest-context";
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
  const model = await loadTokenManifestViewModel();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeInitializer />
        <StagedManifestProvider baseManifest={model}>
          <WorkbenchShell>{children}</WorkbenchShell>
        </StagedManifestProvider>
      </body>
    </html>
  );
}
