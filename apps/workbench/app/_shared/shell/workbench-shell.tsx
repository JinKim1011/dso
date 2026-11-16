import { Footer } from "@/_shared/shell/footer/footer";
import { Header } from "@/_shared/shell/header/header";
import { ScreenLock } from "@/_shared/shell/screen-lock";
import type { ReactNode } from "react";
import { Suspense } from "react";

type WorkbenchShellProps = {
  children: ReactNode;
  email: string;
  projectName: string;
};

function HeaderFallback() {
  return <div className="h-10 w-full" aria-hidden="true" />;
}

export function WorkbenchShell({ children, email, projectName }: WorkbenchShellProps) {
  return (
    <ScreenLock>
      <div className="flex h-screen flex-col">
        <Suspense fallback={<HeaderFallback />}>
          <Header projectName={projectName} />
        </Suspense>

        <main className="mx-mini flex-1 overflow-hidden">{children}</main>

        <Footer email={email} />
      </div>
    </ScreenLock>
  );
}
