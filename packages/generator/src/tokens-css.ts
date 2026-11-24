import {
  assertCssClassSegment,
  assertCssCustomPropertyName,
  assertCssPrimitiveValue,
  assertCssSemanticAlias,
} from "@repo/generator/css-value";
import { TokensCssRenderError } from "@repo/generator/errors";
import type { GeneratedToken } from "@repo/generator/types";

type CssDeclaration = {
  name: string;
  value: string;
};

function compareTokenIds(left: GeneratedToken, right: GeneratedToken): number {
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function requireCssVar(token: GeneratedToken): string {
  if (token.cssVar === null) {
    throw new TokensCssRenderError(
      "missing-css-var",
      `Token "${token.id}" needs a CSS custom property name.`,
      token.id,
    );
  }

  assertCssCustomPropertyName(token.cssVar, token.id);
  return token.cssVar;
}

function primitiveValue(token: GeneratedToken): string {
  if (token.value.kind !== "single") {
    throw new TokensCssRenderError(
      "unsafe-css-value",
      `Primitive token "${token.id}" does not have a single CSS value.`,
      token.id,
    );
  }

  assertCssPrimitiveValue(token.value.value, token.id);
  return token.value.value;
}

function semanticAlias(token: GeneratedToken, value: string): string {
  assertCssSemanticAlias(value, token.id);
  return value;
}

function renderDeclarations(declarations: readonly CssDeclaration[]): string[] {
  return declarations.map(({ name, value }) => `  ${name}: ${value};`);
}

function renderRoot(tokens: readonly GeneratedToken[]): string | null {
  const declarations: CssDeclaration[] = [];

  for (const token of tokens) {
    if (token.kind === "primitive" && token.value.kind !== "single") {
      throw new TokensCssRenderError(
        "unsafe-css-value",
        `Primitive token "${token.id}" does not have a single CSS value.`,
        token.id,
      );
    }

    if (token.value.kind === "single") {
      const value =
        token.kind === "primitive"
          ? primitiveValue(token)
          : /^var\(--[A-Za-z0-9_-]+\)$/.test(token.value.value)
            ? semanticAlias(token, token.value.value)
            : primitiveValue(token);

      declarations.push({ name: requireCssVar(token), value });
      continue;
    }

    if (token.value.kind === "modes" && token.value.light !== undefined) {
      declarations.push({
        name: requireCssVar(token),
        value: semanticAlias(token, token.value.light),
      });
    }
  }

  if (declarations.length === 0) return null;

  return [":root {", ...renderDeclarations(declarations), "}"].join("\n");
}

function renderDark(tokens: readonly GeneratedToken[]): string | null {
  const declarations = tokens.flatMap((token) =>
    token.value.kind === "modes" && token.value.dark !== undefined
      ? [
          {
            name: requireCssVar(token),
            value: semanticAlias(token, token.value.dark),
          },
        ]
      : [],
  );

  if (declarations.length === 0) return null;

  return ['[data-theme="dark"] {', ...renderDeclarations(declarations), "}"].join("\n");
}

function renderTypographyClass(token: GeneratedToken): string | null {
  if (token.value.kind !== "typography") return null;

  assertCssClassSegment(token.name, token.id);

  const declarations: CssDeclaration[] = [];

  for (const [name, value] of [
    ["font-size", token.value.fontSize],
    ["font-weight", token.value.fontWeight],
    ["line-height", token.value.lineHeight],
  ] as const) {
    if (value !== undefined) {
      declarations.push({ name, value: semanticAlias(token, value) });
    }
  }

  if (declarations.length === 0) return null;

  return [
    `  .text-${token.name} {`,
    ...declarations.map(({ name, value }) => `    ${name}: ${value};`),
    "  }",
  ].join("\n");
}

function renderTypographyLayer(tokens: readonly GeneratedToken[]): string | null {
  const seenClassNames = new Set<string>();
  const classes: string[] = [];

  for (const token of tokens) {
    const rendered = renderTypographyClass(token);

    if (rendered === null) continue;

    const className = `text-${token.name}`;

    if (seenClassNames.has(className)) {
      throw new TokensCssRenderError(
        "invalid-class-name",
        `Token "${token.id}" produces a duplicate typography class name.`,
        token.id,
      );
    }

    seenClassNames.add(className);

    classes.push(rendered);
  }

  if (classes.length === 0) return null;

  return [
    "@layer components {",
    ...classes.flatMap((value, index) => (index === 0 ? [value] : ["", value])),
    "}",
  ].join("\n");
}

export function renderTokensCss(resolvedTokens: readonly GeneratedToken[]): string {
  const tokens = [...resolvedTokens].sort(compareTokenIds);
  const blocks = [
    renderRoot(tokens),
    renderDark(tokens),
    renderTypographyLayer(tokens),
  ].filter((value): value is string => value !== null);

  return blocks.length === 0 ? "" : `${blocks.join("\n\n")}\n`;
}
