import type { Component } from "@repo/contracts/type";

type ComponentRow = {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string;
  document_path: string;
};

export function mapComponentRow(row: ComponentRow): Component {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    documentPath: row.document_path,
  };
}
