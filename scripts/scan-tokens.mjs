import fs from "fs";
import { globSync } from "glob";
import path from "path";
import ts from "typescript";
import { TOKEN_CSS_VAR_RULES } from "./config/tokenCssVarMap.mjs";
import { extractTypographyRecipes } from "./lib/typeParser.mjs";

const TOKENS_PATH = path.resolve("./packages/ui/src/types");
const CSS_PATH = path.resolve("./packages/ui/src/index.css");
const OUTPUT_PATH = path.resolve("./design-tokens-manifest.json");

const tokenFiles = globSync(`${TOKENS_PATH}/**/*.ts`);

function extractCssVars(cssContent) {
  const readVars = (block) => {
    const map = new Map();
    const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    let match;

    while ((match = re.exec(block)) !== null) {
      const varName = match[1].trim();
      const varValue = match[2].trim();
      map.set(varName, varValue);
    }

    return map;
  };

  const rootBlockMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
  const darkBlockMatch = cssContent.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);
  const themeBlockMatch = cssContent.match(/@theme\s*\{([\s\S]*?)\}/);

  const rootVars = readVars(rootBlockMatch ? rootBlockMatch[1] : "");
  const darkVars = readVars(darkBlockMatch ? darkBlockMatch[1] : "");
  const themeVars = readVars(themeBlockMatch ? themeBlockMatch[1] : "");
  const allVars = readVars(cssContent);

  return {
    light: rootVars,
    dark: darkVars,
    base: new Map([...themeVars, ...allVars]),
  };
}

function normalizeUnionMember(typeNode, sourceFile) {
  const text = typeNode.getText(sourceFile).trim();

  if (ts.isTemplateLiteralTypeNode(typeNode)) {
    if (text.startsWith("`") && text.endsWith("`")) {
      return text.slice(1, -1);
    }
    return text;
  }

  return text.replace(/^["']|["']$/g, "");
}

const RULE_BY_TYPE = new Map(TOKEN_CSS_VAR_RULES.map((rule) => [rule.type, rule]));

function enrichTokensWithCssValues(category, typeName, values, cssVarMap) {
  const rule = RULE_BY_TYPE.get(typeName);

  if (!rule?.cssVarPrefix) return undefined;

  return values.map((name) => {
    const cssVar = `${rule.cssVarPrefix}${name}`;

    if (category === "color" || category === "shadow") {
      const light = cssVarMap.light.get(cssVar) ?? null;
      const dark = cssVarMap.dark.get(cssVar) ?? null;

      return {
        name,
        cssVar,
        values: { light, dark },
        status: {
          light: light ? "matched" : "missing",
          dark: dark ? "matched" : "missing",
        },
      };
    }

    const value = cssVarMap.base.get(cssVar) ?? null;

    return {
      name,
      cssVar,
      value,
      status: value ? "matched" : "missing",
    };
  });
}

function buildUnionValueIndex(entries) {
  const index = new Map();

  for (const entry of entries) {
    if (Array.isArray(entry.value)) {
      index.set(entry.type, entry.value);
    }
  }

  return index;
}

function expandTemplateValue(template, valueIndex) {
  const placeholderRe = /\$\{([A-Za-z0-9_]+)\}/;
  const match = template.match(placeholderRe);

  if (!match) return [template];

  const refType = match[1];
  const refValues = valueIndex.get(refType) || [];

  if (!refValues.length) return [];

  const resolved = [];

  for (const refValue of refValues) {
    const replaced = template.replace(match[0], refValue);
    resolved.push(...expandTemplateValue(replaced, valueIndex));
  }

  return resolved;
}

function attachClassUnionTemplateMetadata(entries) {
  const valueIndex = buildUnionValueIndex(entries);

  for (const entry of entries) {
    if (entry.kind !== "class-union" || !Array.isArray(entry.value)) continue;

    const literals = [];
    const templates = [];

    for (const item of entry.value) {
      const references = [...item.matchAll(/\$\{([A-Za-z0-9_]+)}/g)].map((m) => m[1]);

      if (!references.length) {
        literals.push(item);
        continue;
      }

      const resolvedValues = expandTemplateValue(item, valueIndex);

      templates.push({
        template: item,
        references,
        resolvedValues,
        status: resolvedValues.length ? "resolved" : "unresolved",
      });
    }

    entry.templateMeta = {
      mode: "template-first",
      literals,
      templates,
    };
  }
}

function attachTypographySemanticMap(entries, sourceText, fileName) {
  if (fileName !== "typography.ts") return;

  const target = entries.find((entry) => entry.type === "TypographyVariant");
  if (!target) return;

  const recipes = extractTypographyRecipes(sourceText, "typographyRecipes");
  if (!recipes.length) return;

  target.semanticMap = recipes.map((recipe) => ({
    name: recipe.variant,
    fontSize: recipe.fontSize,
    fontWeight: recipe.fontWeight,
    lineHeight: recipe.lineHeight,
  }));

  target.kind = "semantic";
}

function parseTokenFiles(filePath) {
  const fileName = path.basename(filePath);
  const sourceText = fs.readFileSync(filePath, "utf-8");

  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  const results = [];

  function visit(node) {
    if (ts.isTypeAliasDeclaration(node) && ts.isUnionTypeNode(node.type)) {
      const typeName = node.name.getText(sourceFile);
      const values = node.type.types.map((typeNode) =>
        normalizeUnionMember(typeNode, sourceFile),
      );

      const rule = RULE_BY_TYPE.get(typeName);
      const category = rule?.category;
      const tokens = enrichTokensWithCssValues(category, typeName, values, cssVarMap);

      const entry = {
        category: category,
        type: typeName,
        kind: rule?.kind ?? "unknown",
        value: values,
      };

      if (tokens) {
        entry.tokens = tokens;
      }

      results.push(entry);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  attachTypographySemanticMap(results, sourceText, fileName);

  return results;
}

const cssContent = fs.readFileSync(CSS_PATH, "utf-8");
const cssVarMap = extractCssVars(cssContent);

const manifest = tokenFiles.flatMap((file) => parseTokenFiles(file)).filter(Boolean);

attachClassUnionTemplateMetadata(manifest);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
