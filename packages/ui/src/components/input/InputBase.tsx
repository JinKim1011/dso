import React from "react";

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

export const InputBase = ({
  rightIcon: RightIcon,
  disabled = false,
  ...props
}: InputBaseProps) => {
  const wrapperClassName = [
    "inline-flex items-center w-full",
    "p-mini gap-mini",
    "border-2 rounded-mini",
    "transition-colors duration-highlightFadeOut ease-outExpo",

    disabled
      ? "bg-surface-secondary text-content-quaternary border-none cursor-not-allowed"
      : "bg-surface-primary text-content-primary focus-within:bg-surface-quaternary focus-within:border-accent-subtle",
  ]
    .filter(Boolean)
    .join(" ");

  const inputClassName = [
    "w-full p-0 bg-transparent outline-none",

    disabled
      ? "text-content-quaternary placeholder:text-content-quaternary cursor-not-allowed"
      : "text-content-primary placeholder:text-content-tertiary",
  ]
    .filter(Boolean)
    .join(" ");

  const iconClassName = [
    "size-4 shrink-0",
    disabled ? "text-content-quaternary" : "text-content-secondary",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={wrapperClassName}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      <input {...props} disabled={disabled} className={inputClassName}></input>
      {RightIcon && <RightIcon aria-hidden className={iconClassName} />}
    </div>
  );
};
