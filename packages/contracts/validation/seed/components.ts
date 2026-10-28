import type { SeedData } from "@repo/contracts/seed";
import { validateDocumentPath } from "@repo/contracts/validation/document-path";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function validateComponents(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];
  const projectIds = new Set(seed.projects.map((project) => project.id));
  const componentById = new Map(
    seed.components.map((component) => [component.id, component]),
  );

  for (const component of seed.components) {
    if (!projectIds.has(component.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "components",
        id: component.id,
        field: "projectId",
        message: `Project "${component.projectId}" does not exist.`,
      });
    }

    const pathError = validateDocumentPath(component.documentPath);

    if (pathError) {
      errors.push({
        code: "invalid-document-path",
        collection: "components",
        id: component.id,
        field: "documentPath",
        message: pathError.message,
      });
    }
  }

  for (const template of seed.documentTemplates) {
    const component = componentById.get(template.componentId);

    if (!component) {
      errors.push({
        code: "missing-record",
        collection: "documentTemplates",
        id: template.id,
        field: "componentId",
        message: `Component "${template.componentId}" does not exist.`,
      });
      continue;
    }

    if (!projectIds.has(template.projectId)) {
      errors.push({
        code: "missing-record",
        collection: "documentTemplates",
        id: template.id,
        field: "projectId",
        message: `Project "${template.projectId}" does not exist.`,
      });
    }

    if (component.projectId !== template.projectId) {
      errors.push({
        code: "wrong-project",
        collection: "documentTemplates",
        id: template.id,
        field: "projectId",
        message: "Template and component must belong to the same project.",
      });
    }
  }

  return errors;
}
