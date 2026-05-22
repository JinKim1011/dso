"use client";

import { cva } from "class-variance-authority";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { Text } from "../Text";

export interface ListItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  id: string;
  text?: string;
  subText?: string;
  selected?: boolean;
  children?: ReactNode;
  onSelect?: () => void;
}

const buttonWrapperClassess =
  "flex w-full h-[3.25rem] items-center border-stroke-primary border-b-[0.5px] transition-[color] ease-outExpo duration-quickTransition cursor-pointer";

const textWrapperClassess =
  "flex w-full h-full items-center gap-miniPlus transition-[color] ease-outExpo duration-regularTransition will-change-transform";

const titleVariant = cva("", {
  variants: {
    selected: {
      true: "text-content-accentStrong",
      false: "text-content-primary/50 group-hover:text-content-accentStrong",
    },
  },
});

const subTextVariant = cva("", {
  variants: {
    selected: {
      true: "text-content-accentStrong/50",
      false: "text-content-secondary/30 group-hover:text-content-accentStrong/50",
    },
  },
});

const actionsVariant = cva("absolute right-0 -translate-y-10", {
  variants: {
    selected: {
      true: "opacity-100",
      false: "opacity-0 group-hover:opacity-100",
    },
  },
});

export const ListItem = ({
  id,
  text,
  subText,
  selected = false,
  children,
  onSelect,
  ...props
}: ListItemProps) => {
  return (
    <li data-testid={id} className="group relative">
      <button
        {...props}
        type="button"
        aria-label={text}
        aria-pressed={selected}
        data-selected={selected}
        className={buttonWrapperClassess}
        tabIndex={0}
        onClick={(event) => {
          props.onClick?.(event);
          if (event.defaultPrevented) {
            return;
          }
          onSelect?.();
        }}
      >
        <div className={textWrapperClassess}>
          <Text variant="meta-sm" className={titleVariant({ selected })}>
            {text}
          </Text>
          <Text variant="meta-xs" className={subTextVariant({ selected })}>
            {subText}
          </Text>
        </div>
      </button>
      <div className={actionsVariant({ selected })}>{children}</div>
    </li>
  );
};
