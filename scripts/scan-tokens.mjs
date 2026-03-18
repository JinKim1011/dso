import fs from "fs";
import path from "path";
import { globSync } from "glob";
import { TOKEN_CSS_VAR_RULES } from "./config/tokenCssVarMap.mjs";
import ts from "typescript";

const TOKENS_PATH = path.resolve("./packages/ui/src/types");
const OUTPUT_PATH = path.resolve("./design-tokens-manifest.json");

const tokenFiles = globSync(`${TOKENS_PATH}/**/*.ts`);

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
    if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.getText(sourceFile);

      if (ts.isUnionTypeNode(node.type)) {
        const values = node.type.types.map((t) => {
          const text = t.getText(sourceFile);

          if (ts.isTemplateLiteralTypeNode) {
            if (text.startsWith("`") && text.endsWith("`")) {
              return text.slice(1, -1);
            }

            return text;
          }
          return text.replace(/[""]/g, "");
        });

        results.push({
          category: fileName.replace(".ts", ""),
          type: typeName,
          value: values,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

const manifest = tokenFiles
  .flatMap((file) => parseTokenFiles(file))
  .filter(Boolean);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
