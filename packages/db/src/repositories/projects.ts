import type { Project } from "@repo/contracts/type";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
};

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at.toISOString(),
  };
}
