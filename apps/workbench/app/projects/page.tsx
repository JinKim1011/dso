// work-in-progress

import { ProjectList } from "@/features/projects/components/project-list";
import { listAccessibleProjects } from "@/features/projects/server/list-accessible-projects";
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

  return <ProjectList projects={projects} configuredProjectId={availableProjectId} />;
}
