"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@repo/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStagedManifest } from "../context/StagedManifestContext";

export function Header() {
  const { changedRowCount, addedManifestLineCount, deletedManifestLineCount } =
    useStagedManifest();
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const displayLabel =
    changedRowCount != null && changedRowCount > 1
      ? `${String(changedRowCount)} TOKENS CHANGED`
      : changedRowCount === 1
        ? "1 TOKEN CHANGED"
        : "NO TOKENS CHANGED";
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

  return (
    <div
      className="px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between"
      style={{ backgroundImage: "var(--header-gradient)" }}
    >
      <div className="gap-mini inline-flex">
        {path === "/staged" ? (
          <>
            <Button
              size="sm"
              label="BACK"
              variant="void"
              leftIcon={ChevronLeftIcon}
              onClick={handleBack}
            />
          </>
        ) : (
          <>
            <Text variant="label-sm" as="span">
              DS0
            </Text>
            <Button variant="void" size="sm" label="GitHub" />
            <Button variant="void" size="sm" label="Docs" />
          </>
        )}
      </div>
      <div className="gap-small flex">
        {addedManifestLineCount > 0 ? (
          <Text variant="label-xs" className="text-content-success">
            `+ ${String(addedManifestLineCount)}`
          </Text>
        ) : null}
        {deletedManifestLineCount > 0 ? (
          <Text variant="label-xs" className="text-content-error">
            `- ${String(deletedManifestLineCount)}`
          </Text>
        ) : null}
        <Link key="staged" href={stagedHref} aria-label="staged">
          <Button
            size="sm"
            label={displayLabel}
            variant="void"
            rightIcon={ChevronRightIcon}
          />
        </Link>
      </div>
    </div>
  );
}
