"use client";

import { Text } from "@repo/ui";
import { ReactNode } from "react";

type CategoryNodeProps = {
  testId?: string;
  label: string;
  children?: ReactNode;
};

export function CategoryNode({ testId, label, children }: CategoryNodeProps) {
  return (
    <section data-testid={testId}>
      <div className="bg-surface-accentStrong py-microPlus px-mini w-fit">
        <Text as="h2" variant="control-md" className="text-content-accent">
          {label}
        </Text>
      </div>
      {children}
    </section>
  );
}
