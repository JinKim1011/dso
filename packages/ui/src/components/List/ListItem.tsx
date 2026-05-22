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

const textVariant = cva("", {
  variants: {
    selected: {
      true: "text-content-accentStrong",
      false: "text-content-primary/50 group-hover:text-content-accentStrong",
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
  const wrapperClass = [
    "flex w-full h-[3.25rem] items-center",
    "border-stroke-primary border-b-[0.5px]",
    "transition-[color] ease-outExpo duration-quickTransition",
    "cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");

  const textWrapperClass = [
    "flex w-full h-full items-center gap-miniPlus",
    "transition-[color] ease-outExpo duration-regularTransition",
    "will-change-transform",
  ]
    .filter(Boolean)
    .join(" ");

  const textClass = [
    selected
      ? "text-content-accentStrong"
      : "text-content-primary/50 group-hover:text-content-accentStrong",
  ]
    .filter(Boolean)
    .join(" ");

  const subTextClass = [
    selected
      ? "text-content-accentStrong/50"
      : "text-content-secondary/30 group-hover:text-content-accentStrong/50",
  ]
    .filter(Boolean)
    .join(" ");

  const actionWrapperClass = [
    "absolute right-0 -translate-y-10",
    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li data-testid={id} className="group relative">
      <button
        {...props}
        type="button"
        aria-label={text}
        aria-pressed={selected}
        data-selected={selected}
        className={wrapperClass}
        tabIndex={0}
        onClick={(event) => {
          props.onClick?.(event);
          if (event.defaultPrevented) {
            return;
          }
          onSelect?.();
        }}
      >
        <div className={textWrapperClass}>
          <Text variant="meta-sm" className={textVariant({ selected })}>
            {text}
          </Text>
          <Text variant="meta-xs" className={subTextClass}>
            {subText}
          </Text>
        </div>
      </button>
      <div className={actionWrapperClass}>{children}</div>
    </li>
  );
};
