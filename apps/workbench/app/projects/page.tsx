// work-in-progress

import { listAccessibleProjects } from "@/features/projects/server/list-accessible-projects";
import { ProjectsView } from "@/features/projects/views/projects-view";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { getWorkbenchProjectId } from "@/server/workbench-config";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const context = await getCurrentSession();
  if (!context) {
    redirect("/login?reason=project-authentication-required");
  }

  const projects = await listAccessibleProjects(getDatabasePool(), context);

  const configuredProjectId = getWorkbenchProjectId().toLowerCase();
  const availableProjectId =
    projects.find((project) => project.id.toLowerCase() === configuredProjectId)?.id ??
    null;

  return <ProjectsView projects={projects} configuredProjectId={availableProjectId} />;
}
