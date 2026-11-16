import { Footer } from "@/_shared/shell/footer";
import { Header } from "@/_shared/shell/header";
import { ScreenLock } from "@/_shared/shell/screen-lock";
import { ProjectMemberRole } from "@repo/contracts/validation/enum";
import type { ReactNode } from "react";
import { Suspense } from "react";

type WorkbenchShellProps = {
  children: ReactNode;
  email: string;
  role: ProjectMemberRole;
};

function HeaderFallback() {
  return <div className="h-10 w-full" aria-hidden="true" />;
}

export function WorkbenchShell({ children, email, role }: WorkbenchShellProps) {
  return (
    <ScreenLock>
      <div className="flex h-screen flex-col">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>

        <main className="mx-mini flex-1 overflow-hidden">{children}</main>

        <Footer email={email} role={role} />
      </div>
    </ScreenLock>
  );
}
