import type { Metadata } from "next";
import "./globals.css";
import "@repo/ui/index.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
