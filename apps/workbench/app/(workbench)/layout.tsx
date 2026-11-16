import { WorkbenchShell } from "@/_shared/shell/workbench-shell";
import { loadWorkbenchProject } from "@/features/projects/server/load-workbench-project";
import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { StagedContextProvider } from "@/features/tokens/state/staged-context";
import { getCurrentSession } from "@/server/current-session";
import { getDatabasePool } from "@/server/database";
import { getWorkbenchProjectId } from "@/server/workbench-config";
import { ProjectAccessDeniedError } from "@repo/application/errors";
import { getAuthenticatedUser } from "@repo/application/services/authentication";
import { redirect } from "next/navigation";

export default async function WorkbenchLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentSession();

  if (!context) {
    redirect("/login?reason=project-authentication-required");
  }

  let workbenchProject;

  try {
    workbenchProject = await loadWorkbenchProject(
      getDatabasePool(),
      context,
      getWorkbenchProjectId(),
    );
  } catch (error) {
    if (error instanceof ProjectAccessDeniedError) {
      redirect("/projects?reason=project-access-denied");
    }
    throw error;
  }

  const model = buildTokenGraphViewModel(
    workbenchProject.tokenTypes,
    workbenchProject.tokens,
    workbenchProject.references,
  );

  const user = await getAuthenticatedUser(getDatabasePool(), context);

  return (
    <StagedContextProvider
      key={workbenchProject.project.id}
      projectId={workbenchProject.project.id}
      baseManifest={model}
    >
      <WorkbenchShell email={user.email} projectName={workbenchProject.project.name}>
        {children}
      </WorkbenchShell>
    </StagedContextProvider>
  );
}
