"use client";

import { Button, Text } from "@repo/ui";

export function Header() {
  return (
    <div
      className="px-mini py-mini text-content-primary flex h-10 w-full items-center justify-between"
      style={{ backgroundImage: "var(--header-gradient)" }}
    >
      <div className="gap-mini inline-flex">
        <Text variant="label-sm" as="span">
          DS0
        </Text>
        <Button variant="void" size="sm" label="GitHub" />
        <Button variant="void" size="sm" label="Docs" />
      </div>
    </div>
  );
}
