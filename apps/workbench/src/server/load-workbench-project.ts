import type {
  Component,
  DocumentTemplate,
  Project,
  Release,
  Token,
  TokenReference,
  TokenType,
} from "@repo/contracts/type";
import { listComponentsByProjectId } from "@repo/db/repositories/components";
import { findProjectById } from "@repo/db/repositories/projects";
import { listTokenReferencesByProjectId } from "@repo/db/repositories/references";
import { listPublishedReleasesByProjectId } from "@repo/db/repositories/releases";
import { listDocumentTemplatesByProjectId } from "@repo/db/repositories/templates";
import { listTokenTypesByProjectId } from "@repo/db/repositories/token-types";
import { listTokensByProjectId } from "@repo/db/repositories/tokens";
import type { Pool } from "pg";

export type WorkbenchProjectData = {
  project: Project;
  tokenTypes: TokenType[];
  tokens: Token[];
  references: TokenReference[];
  components: Component[];
  templates: DocumentTemplate[];
  publishedReleases: Release[];
};

export async function loadWorkbenchProject(
  database: Pick<Pool, "query">,
  projectId: string,
): Promise<WorkbenchProjectData> {
  const project = await findProjectById(database, projectId);

  if (!project) {
    throw new Error(`Workbench project not found: ${projectId}`);
  }

  const [tokenTypes, tokens, references, components, templates, publishedReleases] =
    await Promise.all([
      listTokenTypesByProjectId(database, projectId),
      listTokensByProjectId(database, projectId),
      listTokenReferencesByProjectId(database, projectId),
      listComponentsByProjectId(database, projectId),
      listDocumentTemplatesByProjectId(database, projectId),
      listPublishedReleasesByProjectId(database, projectId),
    ]);

  return {
    project,
    tokenTypes,
    tokens,
    references,
    components,
    templates,
    publishedReleases,
  };
}
