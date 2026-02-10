"use client";

import type React from "react";
import {
  BgClass,
  BorderClass,
  TextClass,
  PaddingXClass,
  PaddingYClass,
  TextSizeClass,
  HoverBgClass,
  HoverTextClass,
  HoverBorderClass,
  ActiveBgClass,
  ActiveTextClass,
  ActiveBorderClass,
} from "./types/tokens";

type ButtonVariant = "fill" | "outlined" | "void";
type ButtonSize = "mini" | "small" | "regular" | "large";

const variantClasses: Record<ButtonVariant, {
  base: `${BgClass} ${TextClass} ${BorderClass}`;
  hover: `${HoverBgClass} ${HoverTextClass} ${HoverBorderClass}`;
  active: `${ActiveBgClass} ${ActiveTextClass} ${ActiveBorderClass}`;
}> = {
  fill: {
    base: "bg-surface-primary text-content-primary border-transparent",
    hover: "hover:bg-surface-secondary hover:text-content-primary hover:border-transparent",
    active: "active:bg-surface-tertiary active:text-content-secondary active:border-transparent"
  },
  outlined: {
    base: "bg-transparent text-content-primary border-stroke-primary",
    hover: "hover:bg-surface-secondary hover:text-content-primary hover:border-stroke-secondary",
    active: "active:bg-surface-tertiary active:text-content-secondary active:border-stroke-tertiary"
  },
  void: {
    base: "bg-transparent text-content-primary border-transparent",
    hover: "hover:bg-surface-secondary hover:text-content-primary hover:border-transparent",
    active: "active:bg-surface-tertiary active:text-content-secondary active:border-transparent"
  }
}

const sizeClasses: Record<ButtonSize, `${TextSizeClass} ${PaddingXClass} ${PaddingYClass}`> = {
  mini: "text-mini px-micro py-0",
  small: "text-small px-microPlus py-micro",
  regular: "text-small px-mini py-microPlus",
  large: "text-regular px-mini py-mini"
}

export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = ({
  variant = "fill",
  size = "regular",
  fullWidth = false,
  children,
  ...props
}: ButtonProps) => {

  const className = [
    variantClasses[variant].base,
    variantClasses[variant].hover,
    variantClasses[variant].active,
    sizeClasses[size],
    fullWidth ? "w-full" : "w-auto",
    "border",
    "inline-flex items-center justify-center",
    "transition-colors transition-transform",
    "duration-quickTransition",
    "ease-outExpo",
    "hover:underline hover:underline-offset-[4px]",
    "active:translate-y-0.5 active:scale-[0.98]"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={className}>
      {children}
    </button>
  )
}