import { cva } from "class-variance-authority";
import type React from "react";
import { typographyStyles } from "../../types/tokens";

export type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export interface InputBaseProps extends Omit<
  React.ComponentPropsWithoutRef<"input">,
  "className"
> {
  rightIcon?: IconComponent;
}

const inputBaseVariant = cva(
  "inline-flex items-center w-full p-mini gap-mini rounded-mini shadow-surface-lifted transition-colors duration-highlightFadeOut ease-outQuad",
  {
    variants: {
      disabled: {
        true: "bg-surface-secondary text-content-quaternary cursor-not-allowed",
        false:
          "bg-surface-secondary text-content-primary focus-within:bg-surface-quaternary focus-within:shadow-focus-accent",
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
);

const inputVariant = cva(
  `${typographyStyles["control-xs"]} w-full p-0 bg-transparent outline-none`,
  {
    variants: {
      readOnly: {
        true: "cursor-pointer select-none caret-transparent",
        false: "cursor-text select-text",
      },
      disabled: {
        true: "text-content-quaternary placeholder:text-content-quaternary cursor-not-allowed",
        false: "text-content-primary placeholder:text-content-tertiary",
      },
    },
    defaultVariants: {
      readOnly: false,
      disabled: false,
    },
  },
);

const iconVariant = cva("size-4 shrink-0", {
  variants: {
    disabled: {
      true: "text-content-quaternary",
      false: "text-content-secondary",
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

export const InputBase = ({
  rightIcon: RightIcon,
  disabled = false,
  readOnly = false,
  ...props
}: InputBaseProps) => {
  return (
    <div
      className={inputBaseVariant({ disabled })}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      <input
        {...props}
        disabled={disabled}
        readOnly={readOnly}
        className={inputVariant({ readOnly, disabled })}
        spellCheck={false}
      ></input>
      {RightIcon && <RightIcon aria-hidden className={iconVariant({ disabled })} />}
    </div>
  );
};
