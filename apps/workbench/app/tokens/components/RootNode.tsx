"use client";

import { Text } from "@repo/ui";
import { ReactNode } from "react";

type RootNodeProps = {
  label: string;
  children: ReactNode;
};

export function RootNode({ label, children }: RootNodeProps) {
  return (
    <section>
      <div className="bg-surface-secondary py-microPlus px-mini w-fit">
        <Text as="h1" variant="control-md" className="text-content-accent">
          {label}
        </Text>
      </div>
      {children}
    </section>
  );
}
