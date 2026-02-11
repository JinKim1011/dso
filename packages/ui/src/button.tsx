"use client";

import type React from "react";
import {
  BgClass,
  BorderClass,
  TextColorClass,
  PaddingXClass,
  PaddingYClass,
  TextSizeClass,
  HoverBgClass,
  HoverTextClass,
  HoverBorderClass,
  ActiveBgClass,
  ActiveTextClass,
  ActiveBorderClass,
  MarginXClass,
  MarginYClass,
} from "./types/tokens";

type ButtonVariant = "fill" | "outlined" | "void";
type ButtonSize = "mini" | "small" | "regular" | "large";

const variantClasses: Record<ButtonVariant, {
  base: `${BgClass} ${TextColorClass} ${BorderClass}`;
  hover: `${HoverBgClass} ${HoverTextClass} ${HoverBorderClass}`;
  active: `${ActiveBgClass} ${ActiveTextClass} ${ActiveBorderClass}`;
}> = {
  fill: {
    base: "bg-surface-quaternary text-content-primary border-transparent",
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

const sizeClasses: Record<ButtonSize, {
  base: `${TextSizeClass} ${PaddingXClass} ${PaddingYClass}`,
  hover: `-${MarginXClass} -${MarginYClass}`,
  active: `-${MarginXClass} -${MarginYClass}`,
}> = {
  mini: {
    base: "text-mini px-micro py-0",
    hover: "-mx-micro -my-0",
    active: "-mx-micro -my-0",
  },
  small: {
    base: "text-small px-microPlus py-0",
    hover: "-mx-microPlus -my-micro",
    active: "-mx-microPlus -my-micro",
  },
  regular: {
    base: "text-small px-mini py-microPlus",
    hover: "-mx-mini -my-microPlus",
    active: "-mx-mini -my-microPlus",
  },
  large: {
    base: "text-regular px-mini py-mini",
    hover: "-mx-mini -my-mini",
    active: "-mx-mini -my-mini",
  }
}

export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  inline?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  variant = "fill",
  size = "regular",
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
    "cursor-pointer"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={className}>
      {children}
    </button>
  )
}