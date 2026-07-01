"use client";

import { Button } from "@repo/ui";
import type { StagedFilterOption } from "../lib/StagedFilterOption";

type StagedFilterProps = {
  activeFilter: StagedFilterOption;
  onChange: (filter: StagedFilterOption) => void;
  availableOptions: readonly StagedFilterOption[];
};

export function StagedFilter({
  activeFilter,
  onChange,
  availableOptions,
}: StagedFilterProps) {
  return (
    <div className="gap-microPlus py-mini scrollbar-none-all flex overflow-x-scroll">
      {availableOptions.map((option) => (
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
