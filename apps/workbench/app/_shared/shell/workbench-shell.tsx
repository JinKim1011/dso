import { Footer } from "@/_shared/shell/footer";
import { Header } from "@/_shared/shell/header";
import { ScreenLock } from "@/_shared/shell/screen-lock";
import type { ReactNode } from "react";
import { Suspense } from "react";

function HeaderFallback() {
  return <div className="h-10 w-full" aria-hidden="true" />;
}

export function WorkbenchShell({ children }: { children: ReactNode }) {
  return (
    <ScreenLock>
      <div className="flex h-screen flex-col">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>

        <main className="mx-mini flex-1 overflow-hidden">{children}</main>

        <Footer />
      </div>
    </ScreenLock>
  );
}
