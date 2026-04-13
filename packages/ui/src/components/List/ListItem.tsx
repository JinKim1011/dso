"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { createMotionTransition } from "../../types/motion";
import { Text } from "../Text";

type Level = 0 | 1 | 2 | 3 | 4;

const listItemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: createMotionTransition("quick", "outExpo"),
  },
};

export interface ListItemProps extends Omit<HTMLMotionProps<"li">, "className"> {
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
  const finiteLevel = Number.isFinite(level) ? level : 0;
  const normalizedLevel = Math.min(4, Math.max(0, Math.floor(finiteLevel)));
  const isInteractive = Boolean(onSelect);
  const indexTextClass = selected
    ? "text-content-accent"
    : "text-content-quaternary group-hover:text-content-primary";
  const titleTextClass = selected
    ? "text-content-primary"
    : "text-content-tertiary group-hover:text-content-primary";
  const subTextClass = selected
    ? "text-content-primary"
    : "text-content-tertiary group-hover:text-content-primary";

  const wrapperClasses = [
    "group flex w-full items-start justify-start",
    "py-miniPlus px-small gap-regularPlus rounded-micro",
    "transition-[box-shadow,background-color,color] duration-slowTransition ease-outExpo",
    isInteractive
      ? "cursor-pointer focus-visible:outline-none focus-visible:shadow-focus-accent"
      : "cursor-default",

    selected
      ? "bg-surface-quaternary shadow-surface-pressed text-content-accent"
      : "bg-surface-tertiary shadow-surface-lifted hover:bg-surface-quaternary hover:shadow-surface-pressed hover:text-content-accent",
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

  return (
    <motion.li
      {...props}
      className={wrapperClasses}
      variants={listItemVariants}
      whileHover={{ y: 2, scale: 0.98 }}
      role={isInteractive ? "option" : props.role}
      tabIndex={isInteractive ? 0 : props.tabIndex}
      onClick={
        isInteractive
          ? (event) => {
              props.onClick?.(event);

              if (!event.defaultPrevented) {
                onSelect?.();
              }
            }
          : props.onClick
      }
      onKeyDown={
        isInteractive
          ? (event) => {
              props.onKeyDown?.(event);

              if (event.defaultPrevented) {
                return;
              }

              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.();
              }
            }
          : props.onKeyDown
      }
      layout
      aria-selected={isInteractive ? selected : undefined}
    >
      <Text variant="label-xs" className={indexTextClass}>
        {index}
      </Text>
      <div className="gap-miniPlus flex min-w-0 flex-1 flex-col">
        <Text variant="label-xs" className={titleTextClass}>
          {text}
        </Text>
        <div className="gap-mini flex w-full min-w-0">
          <Text
            variant="meta-xs"
            className={`${subTextClass} min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap`}
          >
            {subText}
          </Text>
          <div className="gap-microPlus flex shrink-0 items-center">
            {Array.from({ length: 5 }).map((_, stepIndex) => {
              const isStepActive = stepIndex <= normalizedLevel;
              const colorClass = isStepActive ? activeIndicator : inactiveIndicator;
              const indicatorClasses = `${baseIndicator} ${colorClass}`;

              return <span key={stepIndex} className={indicatorClasses} />;
            })}
          </div>
        </div>
      </div>
    </motion.li>
  );
};
