const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getWorkbenchProjectId(): string {
  const projectId = process.env.DSO_WORKBENCH_PROJECT_ID;

  if (!projectId || !UUID_PATTERN.test(projectId)) {
    throw new Error("DSO_WORKBENCH_PROJECT_ID must be a valid project UUID.");
  }

  return projectId;
}
