"use client";

import { Button } from "@repo/ui";

const FILTER_OPTIONS = [
  "All",
  "COLOR",
  "TYPOGRAPHY",
  "SPACING",
  "RADIUS",
  "SHADOW",
  "MOTION",
] as const;

export type StagedFilterOption = (typeof FILTER_OPTIONS)[number];

type StagedFilterProps = {
  activeFilter: StagedFilterOption;
  onChange: (filter: StagedFilterOption) => void;
};

export function StagedFilter({ activeFilter, onChange }: StagedFilterProps) {
  return (
    <div className="gap-microPlus p-mini border-stroke-primary scrollbar-none-all flex overflow-x-scroll border-b-[0.5px]">
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option}
          size="md"
          variant="void"
          selected={activeFilter === option}
          label={option}
          onClick={() => onChange(option)}
        />
      ))}
    </div>
  );
}
