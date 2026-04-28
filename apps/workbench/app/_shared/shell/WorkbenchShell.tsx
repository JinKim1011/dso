"use client";

import { type ReactNode } from "react";
import WorkbenchShellProvider from "../context/WorkbenchShellContext";
import { Header } from "./Header";
import { Navigation } from "./Navigation";

type WorkbenchShellProps = {
  children: ReactNode;
};

export function WorkbenchShell({ children }: WorkbenchShellProps) {
  const stagedCount = Number(process.env.NEXT_PUBLIC_WORKBENCH_STAGED_COUNT ?? 12);
  const currentBranch =
    process.env.NEXT_PUBLIC_WORKBENCH_CURRENT_BRANCH ?? "style/add-color-design-tokens";
  const userName = process.env.NEXT_PUBLIC_WORKBENCH_USER_NAME ?? "jin1011";

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
