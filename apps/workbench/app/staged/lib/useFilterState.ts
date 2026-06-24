import { useEffect, useMemo, useState } from "react";
import FILTER_OPTIONS, { type StagedFilterOption } from "./StageFilterOption";

type UseFilterStateProps = {
  changedRows: Array<{ category: string }>;
};

export function useFilterState({ changedRows }: UseFilterStateProps) {
  const [activeFilter, setActiveFilter] = useState<StagedFilterOption>("All");

  const filteredCategories = useMemo(() => {
    const options = FILTER_OPTIONS.filter(
      (option) =>
        option === "All" ||
        changedRows.some((row) => row.category.toUpperCase() === option),
    );
    return options;
  }, [changedRows]);

  useEffect(() => {
    if (activeFilter === "All") return;
    if (!filteredCategories.includes(activeFilter)) {
      setActiveFilter("All");
    }
  }, [activeFilter, filteredCategories]);

  return {
    activeFilter,
    setActiveFilter,
    filteredCategories,
  };
}
