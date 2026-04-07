// internal
import { Text } from "../Text";

export type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export type ListboxOptionProps = {
  label: string;
  helperText?: string;
  rightIcon?: IconComponent;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
};

const variantClasses = {
  default: "bg-surface-secondary hover:bg-surface-primary",
  selected: "bg-surface-quaternary hover:bg-surface-quaternary",
  disabled: "bg-surface-tertiary cursor-not-allowed",
};

export function ListboxOption({
  label,
  helperText,
  rightIcon: RightIcon,
  selected = false,
  disabled = false,
  onSelect,
}: ListboxOptionProps) {
  const baseClasses = [
    "flex items-start w-full",
    "py-microPlus px-mini gap-microPlus",
    "bg-surface-secondary text-content-primary cursor-pointer",
    "transition-colors duration-highlightFadeOut ease-outExpo",
    disabled
      ? variantClasses.disabled
      : selected
        ? variantClasses.selected
        : variantClasses.default,
  ]
    .filter(Boolean)
    .join(" ");

  const iconClasses = [
    "size-4 shrink-0",
    selected ? "text-content-accent" : "text-content-secondary",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={baseClasses}
      onClick={onSelect}
      disabled={disabled}
      aria-selected={selected}
      aria-disabled={disabled}
    >
      <div className="flex flex-1 flex-col items-start">
        <Text
          variant="label-xs"
          as="label"
          className={
            disabled
              ? "text-content-quaternary"
              : selected
                ? "text-content-accent"
                : "text-content-primary"
          }
        >
          {label}
        </Text>
        <Text
          variant="input-helper-sm"
          className={
            disabled
              ? "text-content-quaternary"
              : selected
                ? "text-content-accent"
                : "text-content-tertiary"
          }
        >
          {helperText}
        </Text>
      </div>
      {RightIcon && <RightIcon className={iconClasses} />}
    </button>
  );
}
