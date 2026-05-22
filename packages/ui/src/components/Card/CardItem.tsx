"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Text } from "../Text";

type Level = 0 | 1 | 2 | 3 | 4;

export interface CardItemProps extends Omit<
  HTMLMotionProps<"button">,
  "className" | "onClick" | "onKeyDown"
> {
  id: string;
  index?: string;
  text?: string;
  subText?: string;
  level?: Level | number;
  selected?: boolean;
  onClick?: HTMLMotionProps<"button">["onClick"];
  onKeyDown?: HTMLMotionProps<"button">["onKeyDown"];
  onSelect?: () => void;
}

const cardItemVariant = cva(
  "group flex w-full items-start justify-start py-miniPlus px-small gap-regularPlus rounded-micro transition-[box-shadow,background-color,color] duration-slowTransition ease-outExpo",
  {
    variants: {
      isInteractive: {
        true: "cursor-pointer focus-visible:outline-none focus-visible:shadow-focus-accent",
        false: "cursor-default",
      },
      selected: {
        true: "bg-surface-quinary shadow-surface-pressed text-content-accent",
        false:
          "bg-surface-tertiary shadow-surface-lifted hover:bg-surface-quaternary hover:shadow-surface-pressed hover:text-content-accent",
      },
    },
    defaultVariants: {
      isInteractive: false,
      selected: false,
    },
  },
);

const indexTextVariant = cva("", {
  variants: {
    selected: {
      true: "text-content-tertiary",
      false: "text-content-quaternary group-hover:text-content-tertiary",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const titleTextVariant = cva("", {
  variants: {
    selected: {
      ture: "text-content-primary",
      false: "text-content-secondary group-hover:text-content-primary",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const subTextVariant = cva(
  "max-w-40 min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
  {
    variants: {
      selected: {
        true: "text-content-tertiary",
        false: "text-content-quaternary group-hover:text-content-tertiary",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export const CardItem = ({
  id,
  index,
  text,
  subText,
  level = 0,
  selected = false,
  onSelect,
  onClick,
  onKeyDown,
  ...props
}: CardItemProps) => {
  const isInteractive = Boolean(onSelect);

  const handleClick: HTMLMotionProps<"button">["onClick"] = (event) => {
    onClick?.(event);

    if (event.defaultPrevented || !isInteractive) {
      return;
    }

    onSelect?.();
  };

  const handleKeyDown: HTMLMotionProps<"button">["onKeyDown"] = (event) => {
    onKeyDown?.(event);

    if (!isInteractive) {
      return;
    }
  };

  const finiteLevel = Number.isFinite(level) ? level : 0;
  const normalizedLevel = Math.min(4, Math.max(0, Math.floor(finiteLevel)));
  const baseIndicator = "h-2.5 w-0.5";
  const activeIndicator = "bg-surface-accentStrong";
  const inactiveIndicator = [
    selected
      ? "bg-surface-tertiary"
      : "bg-surface-quaternary group-hover:bg-surface-tertiary",
  ]
    .filter(Boolean)
    .join(" ");

  const hoverTransform = { y: 2, scale: 0.98 };

  return (
    <li>
      <motion.button
        {...props}
        data-testid={id}
        type="button"
        aria-label={text}
        aria-pressed={isInteractive ? selected : undefined}
        aria-disabled={!isInteractive ? true : undefined}
        disabled={!isInteractive}
        className={cardItemVariant({ isInteractive, selected })}
        whileHover={hoverTransform}
        animate={selected ? hoverTransform : { y: 0, scale: 1 }}
        tabIndex={isInteractive ? 0 : -1}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        layout
      >
        <Text variant="label-xs" className={indexTextVariant({ selected })}>
          {index}
        </Text>
        <div className="gap-miniPlus flex min-w-0 flex-1 flex-col text-left">
          <Text variant="label-xs" className={titleTextVariant({ selected })}>
            {text}
          </Text>
          <div className="gap-mini flex w-full min-w-0 justify-between">
            <Text variant="meta-xs" className={subTextVariant({ selected })}>
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
      </motion.button>
    </li>
  );
};