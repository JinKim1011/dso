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
} from "./types/tokens";

type ButtonVariant = "fill" | "outlined" | "void";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<
  ButtonVariant,
  {
    base: `${BgClass} ${TextColorClass} ${BorderClass}`;
    hover: `${HoverBgClass} ${HoverTextColorClass} ${HoverBorderClass}`;
    active: `${ActiveBgClass} ${ActiveTextColorClass} ${ActiveBorderClass}`;
  }
> = {
  fill: {
    base: "bg-surface-primary text-content-primary border-transparent",
    hover:
      "hover:bg-surface-secondary hover:text-content-primary hover:border-transparent",
    active:
      "active:bg-surface-tertiary active:text-content-secondary active:border-transparent",
  },
  outlined: {
    base: "bg-transparent text-content-primary border-stroke-primary",
    hover:
      "hover:bg-surface-secondary hover:text-content-primary hover:border-stroke-primary",
    active:
      "active:bg-surface-tertiary active:text-content-secondary active:border-stroke-primary",
  },
  void: {
    base: "bg-transparent text-content-primary border-transparent",
    hover:
      "hover:bg-surface-secondary hover:text-content-primary hover:border-transparent",
    active:
      "active:bg-surface-tertiary active:text-content-secondary active:border-transparent",
  },
};

const sizeClasses: Record<
  ButtonSize,
  {
    base: string;
    hover: `-${MarginXClass} -${MarginYClass}`;
    active: `-${MarginXClass} -${MarginYClass}`;
  }
> = {
  sm: {
    base: `${typographyStyles["control-sm"]} px-microPlus py-0`,
    hover: "-mx-microPlus -my-micro",
    active: "-mx-microPlus -my-micro",
  },
  md: {
    base: `${typographyStyles["control-md"]} px-mini py-microPlus`,
    hover: "-mx-mini -my-microPlus",
    active: "-mx-mini -my-microPlus",
  },
  lg: {
    base: `${typographyStyles["control-md"]} px-mini py-mini`,
    hover: "-mx-mini -my-mini",
    active: "-mx-mini -my-mini",
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
}

export const Button = ({
  variant = "fill",
  size = "md",
  inline = false,
  fullWidth = false,
  children,
  ...props
}: ButtonProps) => {
  const className = [
    variantClasses[variant].base,
    variantClasses[variant].hover,
    variantClasses[variant].active,
    sizeClasses[size].base,
    inline ? sizeClasses[size].hover : "",
    inline ? sizeClasses[size].active : "",
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
      {children}
    </button>
  );
};
