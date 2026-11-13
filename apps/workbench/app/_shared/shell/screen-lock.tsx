"use client";

import { useStagedManifest } from "@/features/tokens/state/staged-context";
import { TerminalLoading, Text } from "@repo/ui";
import type { ReactNode } from "react";

export function ScreenLock({ children }: { children: ReactNode }) {
  const { isApplying } = useStagedManifest();

  return (
    <>
      <div inert={isApplying} aria-busy={isApplying}>
        {children}
      </div>
      <div role="status" aria-live="polite">
        {isApplying && (
          <div className="text-content-accentStrong bg-surface-primary/80 gap-microPlus fixed inset-0 z-100 flex items-center justify-center">
            <Text variant="meta-xxs" as="span">
              APPLYING CHANGES...
            </Text>
            <TerminalLoading
              aria-hidden="true"
              className="text-micro [--duration:1.2s]"
            />
          </div>
        )}
      </div>
    </>
  );
}
