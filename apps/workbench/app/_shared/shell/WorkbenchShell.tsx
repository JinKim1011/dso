"use client";

import { type ReactNode } from "react";
import WorkbenchShellProvider from "../context/WorkbenchShellContext";
import { Header } from "./Header";
import { Navigation } from "./Navigation";

type WorkbenchShellProps = {
  children: ReactNode;
};

export function WorkbenchShell({ children }: WorkbenchShellProps) {
  const stagedCount = 12; // update when component frequecny level feature developed
  const currentBranch = "style/add-color-design-tokens"; // update when user feature developed
  const userName = "jin1011"; // update when user feature developed

  return (
    <WorkbenchShellProvider>
      <div>
        <Header currentBranch={currentBranch} userName={userName}></Header>
        <Navigation stagedCount={stagedCount} />
        <main>{children}</main>
      </div>
    </WorkbenchShellProvider>
  );
}
