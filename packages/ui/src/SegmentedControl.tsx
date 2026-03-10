"use client";

import type React from "react";
import { Button } from "./Button";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type SegmentOption = {
  value: string;
  label?: string;
  iconName?: IconComponent;
};

type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (selected: string) => void;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
};

const baseStyles =
  "bg-surface-primary p-microPlus gap-microPlus border-stroke-secondary inline-flex";

export function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  iconOnly = false,
}: SegmentedControlProps) {
  return (
    <div className={baseStyles}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Button
            key={option.value}
            variant="void"
            size={size}
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
