"use client";

import type { ReactNode } from "react";
import { Header } from "./Header";
import { Navigation } from "./Navigation";

type WorkbenchShellProps = {
  children: ReactNode;
};

export function WorkbenchShell({ children }: WorkbenchShellProps) {
  const stagedCount = 12;
  const currentBranch = "style/add-color-design-tokens";
  const userName = "jin1011";

  return (
    <div>
      <Header currentBranch={currentBranch} userName={userName}></Header>
      <Navigation stagedCount={stagedCount}></Navigation>
      <main>{children}</main>
    </div>
  );
}
