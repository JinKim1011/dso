import { useEffect, useMemo, useState } from "react";
import FILTER_OPTIONS, { type StagedFilterOption } from "./StagedFilterOption";

type UseFilterStateProps = {
  changedRows: Array<{ category: string }>;
};

export function useFilterState({ changedRows }: UseFilterStateProps) {
  const [activeFilter, setActiveFilter] = useState<StagedFilterOption>("ALL");

  const filteredCategories = useMemo(() => {
    const options = FILTER_OPTIONS.filter(
      (option) =>
        option === "ALL" ||
        changedRows.some((row) => row.category.toUpperCase() === option),
    );
    return options;
  }, [changedRows]);

  useEffect(() => {
    if (activeFilter === "ALL") return;
    if (!filteredCategories.includes(activeFilter)) {
      setActiveFilter("ALL");
    }
  }, [activeFilter, filteredCategories]);

  return {
    activeFilter,
    setActiveFilter,
    filteredCategories,
  };
}
