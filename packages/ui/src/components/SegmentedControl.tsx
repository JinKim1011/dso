"use client";

import { Button, type IconComponent } from "./Button";

type SegmentOption = {
  value: string;
  label?: string;
  iconName?: IconComponent;
  ariaLabel?: string;
};

type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (selected: string) => void;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  iconOnly = false,
}: SegmentedControlProps) {
  return (
    <div className="p-microPlus gap-microPlus bg-surface-primary border-stroke-secondary inline-flex w-fit border">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Button
            key={option.value}
            variant="void"
            size={size}
            aria-label={iconOnly ? option.ariaLabel : undefined}
            selected={isActive}
            iconOnly={iconOnly}
            leftIcon={option.iconName}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
