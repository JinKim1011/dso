"use client";

import { StagedHeader } from "@/features/tokens/components/staged/staged-header";
import { TokensHeader } from "@/features/tokens/components/token-header";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STAGED_PATH = "/tokens/staged";

export function Header() {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from");

  const stagedHref = `${STAGED_PATH}?from=${encodeURIComponent(path)}`;

  const handleBack = () => {
    if (returnTo && returnTo.startsWith("/") && returnTo !== STAGED_PATH) {
      router.push(returnTo);
      return;
    }

    router.back();
  };

  return path === STAGED_PATH ? (
    <StagedHeader onBack={handleBack} />
  ) : (
    <TokensHeader stagedHref={stagedHref} />
  );
}
