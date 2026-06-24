"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StagedHeader } from "../../staged/component/StagedHeader";
import { TokensHeader } from "../../tokens/components/TokensHeader";

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
