import { Text } from "@repo/ui";

type StagedRowDetailTagProps = {
  label: string;
  background?: string;
  textColor?: string;
  align?: "justify-start" | "justify-center" | "justify-end";
  leftIcon?: IconComponent;
  rightIcon?: IconComponent;
};

type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export function StagedRowDetailTag({
  label,
  background = "bg-transparent",
  textColor = "text-content-primary",
  align = "justify-start",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
}: StagedRowDetailTagProps) {
  return (
    <div className={`flex w-full ${align}`}>
      <div
        className={`py-micro px-miniPlus ${background} gap-microPlus flex h-fit w-fit items-center`}
      >
        {LeftIcon && (
          <LeftIcon aria-hidden className={`size-3.5 shrink-0 ${textColor}`} />
        )}
        <Text variant="meta-xs" className={textColor}>
          {label}
        </Text>
        {RightIcon && (
          <RightIcon aria-hidden className={`size-3.5 shrink-0 ${textColor}`} />
        )}
      </div>
    </div>
  );
}
