"use client";

import type { ButtonHTMLAttributes, ElementType, Ref } from "react";
import { Text } from "../Text";

export type MenuIcon = ElementType<{ className?: string; "aria-hidden"?: boolean }>;

export type MenuItem =
  | { type: "info"; id: string; label: string }
  | {
      type: "action";
      id: string;
      label: string;
      onSelect: () => void;
      disabled?: boolean;
      closeOnSelect?: boolean;
      rightIcon?: MenuIcon;
    };

type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  item: MenuItem;
  buttonRef?: Ref<HTMLButtonElement>;
};

export function MenuItem({ item, buttonRef, ...props }: MenuItemProps) {
  if (item.type === "info") {
    return (
      <div role="presentation" className="py-microPlus px-mini">
        <Text variant="label-xs" className="text-content-tertiary">
          {item.label}
        </Text>
      </div>
    );
  }

  const RightIcon = item.rightIcon;
  return (
    <button
      {...props}
      ref={buttonRef}
      type="button"
      role="menuitem"
      disabled={item.disabled}
      className="py-mini px-mini gap-microPlus text-content-primary hover:bg-surface-tertiary flex w-full cursor-pointer items-center text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Text variant="label-xs" as="span" className="flex-1">
        {item.label}
      </Text>
      {RightIcon && <RightIcon aria-hidden className="size-3 shrink-0" />}
    </button>
  );
}
