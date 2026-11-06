import { WorkbenchShell } from "@/_shared/shell/workbench-shell";
import { ThemeInitializer } from "@/_shared/theme/theme-initializer";
import "@repo/ui/index.css";
import "@xyflow/react/dist/style.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSO : Workbench",
  description: "Visual git for design token management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeInitializer />
        <WorkbenchShell>{children}</WorkbenchShell>
      </body>
    </html>
  );
}
