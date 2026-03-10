"use client";

import type React from "react";
import {
  BgClass,
  BorderClass,
  TextColorClass,
  HoverBgClass,
  HoverTextColorClass,
  HoverBorderClass,
  ActiveBgClass,
  ActiveTextColorClass,
  ActiveBorderClass,
  MarginXClass,
  MarginYClass,
  typographyStyles,
  IconName,
  ICONS,
} from "./types/tokens";

type ButtonVariant = "fill" | "outlined" | "void";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<
  ButtonVariant,
  {
    base: `${BgClass} ${TextColorClass} ${BorderClass}`;
    hover: `${HoverBgClass} ${HoverTextColorClass} ${HoverBorderClass}`;
    active: `${ActiveBgClass} ${ActiveTextColorClass} ${ActiveBorderClass}`;
    inactive: `${ActiveBgClass} ${ActiveTextColorClass} ${ActiveBorderClass}`;
  }
> = {
  fill: {
    base: "bg-surface-primary text-content-primary border-transparent",
    hover:
      "hover:bg-surface-secondary hover:text-content-primary hover:border-transparent",
    active:
      "active:bg-surface-quaternary active:text-content-primary active:border-transparent",
    inactive:
      "active:bg-surface-tertiary active:text-content-quaternary active:border-transparent",
  },
  outlined: {
    base: "bg-transparent text-content-primary border-stroke-primary",
    hover:
      "hover:bg-surface-secondary hover:text-content-primary hover:border-stroke-primary",
    active:
      "active:bg-surface-quaternary active:text-content-primary active:border-stroke-primary",
    inactive:
      "active:bg-surface-tertiary active:text-content-quaternary active:border-stroke-primary",
  },
  void: {
    base: "bg-transparent text-content-primary border-transparent",
    hover:
      "hover:bg-surface-secondary hover:text-content-primary hover:border-transparent",
    active:
      "active:bg-surface-quaternary active:text-content-primary active:border-transparent",
    inactive:
      "active:bg-surface-tertiary active:text-content-quaternary active:border-transparent",
  },
};

const sizeClasses: Record<
  ButtonSize,
  {
    base: string;
    hover: `-${MarginXClass} -${MarginYClass}`;
    active: `-${MarginXClass} -${MarginYClass}`;
    icon: string;
    iconOnly: string;
  }
> = {
  sm: {
    base: `${typographyStyles["control-sm"]} px-microPlus py-0 gap-micro`,
    hover: "-mx-microPlus -my-micro",
    active: "-mx-microPlus -my-micro",
    icon: "size-3.5 shrink-0",
    iconOnly: "p-microPlus",
  },
  md: {
    base: `${typographyStyles["control-md"]} px-mini py-microPlus gap-microPlus`,
    hover: "-mx-mini -my-microPlus",
    active: "-mx-mini -my-microPlus",
    icon: "size-4 shrink-0",
    iconOnly: "p-mini",
  },
  lg: {
    base: `${typographyStyles["control-md"]} px-mini py-mini gap-mini`,
    hover: "-mx-mini -my-mini",
    active: "-mx-mini -my-mini",
    icon: "size-5 shrink-0",
    iconOnly: "p-mini",
  },
};

export interface ButtonProps extends Omit<
  React.ComponentPropsWithoutRef<"button">,
  "className"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  inline?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIconName?: IconName;
  rightIconName?: IconName;
}

export const Button = ({
  variant = "fill",
  size = "md",
  inline = false,
  fullWidth = false,
  iconOnly = false,
  leftIconName,
  rightIconName,
  children,
  ...props
}: ButtonProps) => {
  const LeftIcon = leftIconName ? ICONS[leftIconName] : null;
  const RightIcon = rightIconName ? ICONS[rightIconName] : null;
  const className = [
    variantClasses[variant].base,
    variantClasses[variant].hover,
    variantClasses[variant].active,
    sizeClasses[size].base,
    inline ? sizeClasses[size].hover : "",
    inline ? sizeClasses[size].active : "",
    iconOnly ? `${sizeClasses[size].iconOnly}` : sizeClasses[size].base,
    fullWidth ? "w-full" : "w-auto",
    "border",
    "inline-flex items-center justify-center",
    "transition-colors transition-transform",
    "duration-highlightFadeOut",
    "ease-outExpo",
    "active:translate-y-0.5 active:scale-[0.98]",
    "cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={className}>
      {LeftIcon && <LeftIcon aria-hidden className={sizeClasses[size].icon} />}
      {!iconOnly && children}
      {RightIcon && (
        <RightIcon aria-hidden className={sizeClasses[size].icon} />
      )}
    </button>
  );
};
