import { WorkbenchShell } from "@/_shared/shell/workbench-shell";
import { loadWorkbenchProject } from "@/features/projects/server/load-workbench-project";
import { buildTokenGraphViewModel } from "@/features/tokens/adapters/database/build-token-graph-view-model";
import { StagedContextProvider } from "@/features/tokens/state/staged-context";
import { getDatabasePool } from "@/server/database";
import { getWorkbenchProjectId } from "@/server/workbench-config";

export default async function WorkbenchLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const workbenchProject = await loadWorkbenchProject(
    getDatabasePool(),
    getWorkbenchProjectId(),
  );
  const model = buildTokenGraphViewModel(
    workbenchProject.tokenTypes,
    workbenchProject.tokens,
    workbenchProject.references,
  );

  return (
    <StagedContextProvider
      key={workbenchProject.project.id}
      projectId={workbenchProject.project.id}
      baseManifest={model}
    >
      <WorkbenchShell>{children}</WorkbenchShell>
    </StagedContextProvider>
  );
}
