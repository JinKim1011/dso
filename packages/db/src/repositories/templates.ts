import type { DocumentTemplate } from "@repo/contracts/type";

type DocumentTemplateRow = {
  id: string;
  project_id: string;
  component_id: string;
  name: string;
  content: string;
};

export function mapDocumentTemplateRow(row: DocumentTemplateRow): DocumentTemplate {
  return {
    id: row.id,
    projectId: row.project_id,
    componentId: row.component_id,
    name: row.name,
    content: row.content,
  };
}
