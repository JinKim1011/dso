import { Text } from "@repo/ui";
import { ReactNode } from "react";

type StagedViewHeaderProps = {
  length: number;
  guidedText: boolean;
  children: ReactNode;
};

export function StagedViewHeader({
  length,
  guidedText,
  children,
}: StagedViewHeaderProps) {
  const count = length.toString();

  return (
    <div className="border-stroke-primary flex h-13 w-full items-center justify-between border-b-[0.5px]">
      <div className="gap-small flex">
        <Text variant="body-sm-strong" className="text-content-primary">
          STAGED CHANGES {count}
        </Text>
        {guidedText && (
          <Text variant="body-sm" className="text-content-accentStrong/50">
            COMMAND + SHIFT + ↑ ↓
          </Text>
        )}
      </div>
      <div className="gap-mini flex h-fit">{children}</div>
    </div>
  );
}
