"use client";

import { StagedHeader } from "@/features/tokens/components/staged/staged-header";
import { TokensHeader } from "@/features/tokens/components/token-header";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function Header() {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from");
  const stagedHref =
    path === "/staged"
      ? `/staged?from=${encodeURIComponent(returnTo ?? "/tokens/color")}`
      : `/staged?from=${encodeURIComponent(path)}`;

  const handleBack = () => {
    if (returnTo && returnTo.startsWith("/") && returnTo !== "/staged") {
      router.push(returnTo);
      return;
    }

    router.back();
  };

  return path === "/staged" ? (
    <StagedHeader onBack={handleBack} />
  ) : (
    <TokensHeader stagedHref={stagedHref} />
  );
}
