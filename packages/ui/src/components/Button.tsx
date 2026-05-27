"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Text } from "./Text";

import type React from "react";
import {
  OverrideBGClass,
  OverrideBorderClass,
  OverrideTextColorClass,
  TypographyVariant,
} from "../types/tokens";

export type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

const buttonVariants = cva(
  "inline-flex items-center justify-center border cursor-pointer transition-colors transition-transform duration-highlightFadeOut ease-outQuad active:translate-y-0.5 active:scale-[0.98]",
  {
    variants: {
      variant: {
        fill: "",
        outlined: "",
        void: "",
      },
      size: {
        sm: `gap-micro px-microPlus py-0`,
        md: `gap-microPlus px-mini py-microPlus`,
        lg: `gap-mini px-mini py-mini`,
      },
      selected: {
        true: "",
        false: "",
      },
      inline: {
        true: "",
        false: "",
      },
      fullWidth: {
        true: "w-full",
        false: "w-fit",
      },
      iconOnly: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "fill",
      size: "md",
      selected: false,
      inline: false,
      fullWidth: false,
      iconOnly: false,
    },
    compoundVariants: [
      {
        variant: "fill",
        selected: false,
        class:
          "border-transparent bg-surface-primary text-content-tertiary hover:border-transparent hover:bg-surface-secondary hover:text-content-primary active:border-transparent active:bg-surface-quaternary active:text-content-primary",
      },
      {
        variant: "fill",
        selected: true,
        class:
          "border-transparent bg-surface-quaternary text-content-primary hover:border-transparent hover:bg-surface-quaternary hover:text-content-primary active:border-transparent active:bg-surface-quaternary active:text-content-primary",
      },
      {
        variant: "outlined",
        selected: false,
        class:
          "border-stroke-primary bg-transparent text-content-tertiary hover:border-stroke-primary hover:bg-surface-secondary hover:text-content-primary active:border-stroke-primary active:bg-surface-quaternary active:text-content-primary",
      },
      {
        variant: "outlined",
        selected: true,
        class:
          "border-stroke-primary bg-surface-quaternary text-content-primary hover:border-stroke-primary hover:bg-surface-quaternary hover:text-content-primary active:border-stroke-primary active:bg-surface-quaternary active:text-content-primary",
      },
      {
        variant: "void",
        selected: false,
        class:
          "border-transparent bg-transparent text-content-tertiary hover:border-transparent hover:bg-surface-secondary hover:text-content-primary active:border-transparent active:bg-surface-quaternary active:text-content-primary",
      },
      {
        variant: "void",
        selected: true,
        class:
          "border-transparent bg-surface-quaternary text-content-primary hover:border-transparent hover:bg-surface-quaternary hover:text-content-primary active:border-transparent active:bg-surface-quaternary active:text-content-primary",
      },
      {
        size: "sm",
        inline: true,
        class: "-mx-microPlus -my-micro",
      },
      {
        size: "md",
        inline: true,
        class: "-mx-mini -my-microPlus",
      },
      {
        size: "lg",
        inline: true,
        class: "-mx-mini -my-mini",
      },
      {
        size: "sm",
        iconOnly: true,
        class: "px-microPlus py-microPlus",
      },
      {
        size: "md",
        iconOnly: true,
        class: "px-mini py-mini",
      },
      {
        size: "lg",
        iconOnly: true,
        class: "px-mini py-mini",
      },
    ],
  },
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

export interface ButtonProps extends Omit<
  React.ComponentPropsWithoutRef<"button">,
  "className"
> {
  className?: string;
  type?: "button" | "submit" | "reset";
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  inline?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: IconComponent;
  rightIcon?: IconComponent;
  overrideBgClass?: OverrideBGClass;
  overrideTextColorClass?: OverrideTextColorClass;
  overrideBorderClass?: OverrideBorderClass;
  selected?: boolean;
}

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "size-3.5 shrink-0",
  md: "size-4 shrink-0",
  lg: "size-5 shrink-0",
};

const textVariant: Record<ButtonSize, TypographyVariant> = {
  sm: "control-xs",
  md: "control-sm",
  lg: "control-sm",
};

export const Button = ({
  type = "button",
  variant = "fill",
  size = "md",
  inline = false,
  fullWidth = false,
  iconOnly = false,
  selected = false,
  label,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  overrideBgClass,
  overrideTextColorClass,
  overrideBorderClass,
  className,
  ...props
}: ButtonProps) => {
  const buttonClassName = cn(
    buttonVariants({
      variant,
      size,
      selected,
      inline,
      fullWidth,
      iconOnly,
    }),
    overrideBgClass,
    overrideTextColorClass,
    overrideBorderClass,
    className,
  );

  return (
    <button type={type} {...props} className={buttonClassName}>
      {LeftIcon && <LeftIcon aria-hidden className={iconSizeClasses[size]} />}
      {!iconOnly && (
        <Text variant={textVariant[size]} as="span">
          {label}
        </Text>
      )}
      {RightIcon && <RightIcon aria-hidden className={iconSizeClasses[size]} />}
    </button>
  );
};
