import "@repo/ui/index.css";
import "@xyflow/react/dist/style.css";
import type { Metadata } from "next";
import { WorkbenchShell } from "./_shared/shell/WorkbenchShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSO : Workbench",
  description: ", visual git for design token management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const saved = localStorage.getItem('dso-theme');
              const mode = saved === 'light' || saved === 'dark' || saved === 'system'
                ? saved
                : 'system';
              const resolved = mode === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : mode;
              document.documentElement.setAttribute('data-theme', resolved);
              document.documentElement.setAttribute('data-theme-mode', mode);
            `,
          }}
        />
      </head>
      <body>
        <WorkbenchShell>{children}</WorkbenchShell>
      </body>
    </html>
  );
}
