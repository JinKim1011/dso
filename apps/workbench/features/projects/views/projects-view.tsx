// work-in-progress

import { ProjectList } from "@/features/projects/components/project-list";
import type { Project } from "@repo/contracts/type";

type ProjectsViewProps = {
  projects: Project[];
  configuredProjectId: string | null;
};

export function ProjectsView({ projects, configuredProjectId }: ProjectsViewProps) {
  return <ProjectList projects={projects} configuredProjectId={configuredProjectId} />;
}
