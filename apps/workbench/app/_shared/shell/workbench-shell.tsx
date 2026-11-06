import { Footer } from "@/_shared/shell/footer";
import { Header } from "@/_shared/shell/header";
import type { ReactNode } from "react";
import { Suspense } from "react";

export function WorkbenchShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      <main className="mx-mini flex-1 overflow-hidden">{children}</main>

      <Footer />
    </div>
  );
}
