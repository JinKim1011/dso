import { fixtureIds } from "@repo/contracts/fixtures/ids";
import { validSeed } from "@repo/contracts/fixtures/valid-seed";
import { CONTRACT_LIMITS } from "@repo/contracts/validation/limit";
import { validateSeedFieldLengths } from "@repo/contracts/validation/seed/field-lengths";
import { describe, expect, it } from "vitest";

const cloneSeed = () => structuredClone(validSeed);

describe("validateSeedFieldLengths", () => {
  it("accepts valid seed fields", () => {
    expect(validateSeedFieldLengths(validSeed)).toEqual([]);
  });

  describe("projects", () => {
    it("accepts a project name at the maximum length", () => {
      const seed = cloneSeed();
      seed.projects[0]!.name = "a".repeat(CONTRACT_LIMITS.projectName);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong project name", () => {
      const seed = cloneSeed();
      seed.projects[0]!.name = "a".repeat(CONTRACT_LIMITS.projectName + 1);

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "projects",
          id: fixtureIds.seed.project,
          field: "name",
          message: `name cannot exceed ${CONTRACT_LIMITS.projectName} characters.`,
        }),
      );
    });

    it("accepts a project slug at the maximum length", () => {
      const seed = cloneSeed();
      seed.projects[0]!.slug = "a".repeat(CONTRACT_LIMITS.projectSlug);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong project slug", () => {
      const seed = cloneSeed();
      seed.projects[0]!.slug = "a".repeat(CONTRACT_LIMITS.projectSlug + 1);

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "projects",
          id: fixtureIds.seed.project,
          field: "slug",
          message: `slug cannot exceed ${CONTRACT_LIMITS.projectSlug} characters.`,
        }),
      );
    });
  });

  describe("tokens", () => {
    it("accepts a token name at the maximum length", () => {
      const seed = cloneSeed();
      seed.tokens[0]!.name = "a".repeat(CONTRACT_LIMITS.tokenName);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong token name", () => {
      const seed = cloneSeed();
      seed.tokens[0]!.name = "a".repeat(CONTRACT_LIMITS.tokenName + 1);

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "tokens",
          id: fixtureIds.seed.tokens[0],
          field: "name",
          message: `name cannot exceed ${CONTRACT_LIMITS.tokenName} characters.`,
        }),
      );
    });

    it("accepts a null CSS variable", () => {
      const seed = cloneSeed();
      seed.tokens[0]!.cssVar = null;

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("accepts a CSS variable at the maximum length", () => {
      const seed = cloneSeed();
      seed.tokens[0]!.cssVar = "a".repeat(CONTRACT_LIMITS.cssVariable);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong CSS variable", () => {
      const seed = cloneSeed();
      seed.tokens[0]!.cssVar = "a".repeat(CONTRACT_LIMITS.cssVariable + 1);

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "tokens",
          id: fixtureIds.seed.tokens[0],
          field: "cssVar",
          message: `cssVar cannot exceed ${CONTRACT_LIMITS.cssVariable} characters.`,
        }),
      );
    });
  });

  describe("components", () => {
    it("accepts a component name at the maximum length", () => {
      const seed = cloneSeed();
      seed.components[0]!.name = "a".repeat(CONTRACT_LIMITS.componentName);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong component name", () => {
      const seed = cloneSeed();
      seed.components[0]!.name = "a".repeat(CONTRACT_LIMITS.componentName + 1);

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "components",
          id: fixtureIds.seed.component,
          field: "name",
          message: `name cannot exceed ${CONTRACT_LIMITS.componentName} characters.`,
        }),
      );
    });

    it("accepts a component description at the maximum length", () => {
      const seed = cloneSeed();
      seed.components[0]!.description = "a".repeat(CONTRACT_LIMITS.componentDescriptions);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong component description", () => {
      const seed = cloneSeed();
      seed.components[0]!.description = "a".repeat(
        CONTRACT_LIMITS.componentDescriptions + 1,
      );

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "components",
          id: fixtureIds.seed.component,
          field: "description",
          message: `description cannot exceed ${CONTRACT_LIMITS.componentDescriptions} characters.`,
        }),
      );
    });

    it("accepts newlines in a component description", () => {
      const seed = cloneSeed();
      seed.components[0]!.description = "Line one\nLine two";

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });
  });

  describe("document templates", () => {
    it("accepts a template name at the maximum length", () => {
      const seed = cloneSeed();
      seed.documentTemplates[0]!.name = "a".repeat(CONTRACT_LIMITS.templateName);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong template name", () => {
      const seed = cloneSeed();
      seed.documentTemplates[0]!.name = "a".repeat(CONTRACT_LIMITS.templateName + 1);

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "documentTemplates",
          id: fixtureIds.seed.documentTemplate,
          field: "name",
          message: `name cannot exceed ${CONTRACT_LIMITS.templateName} characters.`,
        }),
      );
    });

    it("accepts template content at the maximum length", () => {
      const seed = cloneSeed();
      seed.documentTemplates[0]!.content = "a".repeat(CONTRACT_LIMITS.templateContent);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects overlong template content", () => {
      const seed = cloneSeed();
      seed.documentTemplates[0]!.content = "a".repeat(
        CONTRACT_LIMITS.templateContent + 1,
      );

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "documentTemplates",
          id: fixtureIds.seed.documentTemplate,
          field: "content",
          message: `content cannot exceed ${CONTRACT_LIMITS.templateContent} characters.`,
        }),
      );
    });
  });

  describe("releases", () => {
    it("accepts a release version at the maximum length", () => {
      const seed = cloneSeed();
      seed.releases[0]!.version = "a".repeat(CONTRACT_LIMITS.releaseVersion);

      expect(validateSeedFieldLengths(seed)).toEqual([]);
    });

    it("rejects an overlong release version", () => {
      const seed = cloneSeed();
      seed.releases[0]!.version = "a".repeat(CONTRACT_LIMITS.releaseVersion + 1);

      expect(validateSeedFieldLengths(seed)).toContainEqual(
        expect.objectContaining({
          code: "invalid-field",
          collection: "releases",
          id: fixtureIds.seed.release,
          field: "version",
          message: `version cannot exceed ${CONTRACT_LIMITS.releaseVersion} characters.`,
        }),
      );
    });
  });
});
