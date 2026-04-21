"use client";

import { Text } from "@repo/ui";
import { ReactNode } from "react";

type CategoryGroup = {
  id: string;
  category: string;
};

type CategoryNodeProps = {
  category: CategoryGroup;
  children?: ReactNode;
};

export function CategoryNode({ category, children }: CategoryNodeProps) {
  return (
    <section data-testid={category.id}>
      <div className="bg-surface-accentStrong py-microPlus px-mini w-fit">
        <Text as="h2" variant="control-md" className="text-content-accent">
          {category.category}
        </Text>
      </div>
      {children}
    </section>
  );
}
