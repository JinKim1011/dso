"use client";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { DropdownMenu, type MenuItem } from "@repo/ui";

type Project = { id: string; name: string };

export function ProjectSwitch({
  currentProject,
  projects,
}: {
  currentProject: Project;
  projects: Project[];
}) {
  const items: MenuItem[] = projects.map((project) => {
    const isCurrent = project.id === currentProject.id;
    return {
      type: "action",
      id: project.id,
      label: isCurrent ? project.name : `${project.name} (not available yet)`,
      disabled: !isCurrent,
      rightIcon: isCurrent ? CheckIcon : undefined,
      onSelect: () => {},
    };
  });

  return (
    <DropdownMenu label={currentProject.name} rightIcon={CaretSortIcon} items={items} />
  );
}
