import { Text } from "@repo/ui";
import { ReactNode } from "react";

type StagedViewFilterProps = {
  guidedText: boolean;
  children: ReactNode;
};

export function StagedViewFilter({ guidedText, children }: StagedViewFilterProps) {
  const textWrapperClasses = [
    "border-stroke-primary flex h-13 w-full items-center border-b-[0.5px]",
    guidedText ? "justify-between" : "justify-end",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={textWrapperClasses}>
      {guidedText && (
        <Text variant="body-sm" className="text-content-accentStrong/50 pl-mini">
          COMMAND + SHIFT + ↑ ↓
        </Text>
      )}

      <div className="gap-mini flex h-fit">{children}</div>
    </div>
  );
}
