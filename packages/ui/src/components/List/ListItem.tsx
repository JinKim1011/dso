import { ComponentPropsWithoutRef } from "react";
import { Text } from "../Text";

type Level = 0 | 1 | 2 | 3 | 4;

export interface ListItemProps extends Omit<ComponentPropsWithoutRef<"li">, "className"> {
  index?: string;
  text?: string;
  subText?: string;
  level?: Level | number;
  selected?: boolean;
  onSelect?: () => void;
}

export const ListItem = ({
  index,
  text,
  subText,
  level = 0,
  selected = false,
  onSelect,
  ...props
}: ListItemProps) => {
  const wrapperClasses = [
    "group flex w-full justify-start items-start cursor-pointer",
    "py-miniPlus px-small gap-regularPlus rounded-micro",
    "transition-[transform,box-shadow,background-color] duration-regularTransition ease-outCubic",

    selected
      ? "bg-surface-quaternary shadow-surface-pressed translate-y-[2px] scale-[0.98]"
      : "bg-surface-tertiary shadow-surface-lifted hover:shadow-surface-pressed hover:translate-y-[2px] hover:scale-[0.98] hover:bg-surface-quaternary",
  ]
    .filter(Boolean)
    .join(" ");

  const baseIndicator = "h-2.5 w-0.5";
  const activeIndicator = "bg-surface-accentStrong";
  const inactiveIndicator = [
    selected
      ? "bg-surface-tertiary"
      : "bg-surface-quaternary group-hover:bg-surface-tertiary",
  ]
    .filter(Boolean)
    .join(" ");

  const normalizedLevel = Math.min(4, Math.max(0, Math.floor(level ?? 0)));
  const isInteractive = Boolean(onSelect);

  return (
    <li
      className={wrapperClasses}
      aria-selected={selected}
      role={isInteractive ? "option" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onSelect : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      {...props}
    >
      <Text
        variant="label-xs"
        className="text-content-quaternary group-hover:text-content-secondary"
      >
        {index}
      </Text>
      <div className="gap-miniPlus flex w-full flex-col">
        <Text
          variant="label-xs"
          className="text-content-tertiary group-hover:text-content-accent"
        >
          {text}
        </Text>
        <div className="flex w-full">
          <Text
            variant="meta-xs"
            className="text-content-tertiary group-hover:text-content-accent flex-1"
          >
            {subText}
          </Text>
          <div className="gap-microPlus flex items-center">
            {Array.from({ length: 5 }).map((_, stepIndex) => {
              const isStepActive = stepIndex <= normalizedLevel;
              const colorClass = isStepActive ? activeIndicator : inactiveIndicator;
              const indicatorClasses = `${baseIndicator} ${colorClass}`;

              return <div key={stepIndex} className={indicatorClasses}></div>;
            })}
          </div>
        </div>
      </div>
    </li>
  );
};
