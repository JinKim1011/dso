import fs from "fs";
import path from "path";
import { extractUnionValues } from "./lib/typeParser.mjs";

const CSS_PATH = path.resolve("./packages/ui/src/index.css");
const COLOR_TS_PATH = path.resolve("./packages/ui/src/types/color.ts");

export function runColorAudit() {
  const cssContent = fs.readFileSync(CSS_PATH, "utf-8");
  const tsContent = fs.readFileSync(COLOR_TS_PATH, "utf-8");

  let errorCount = 0;

  // hardcoded variants and categories will be replaced in future
  const surfaceVariants = extractUnionValues(tsContent, "SurfaceVariant");
  const contentVariants = extractUnionValues(tsContent, "ContentVariant");
  const strokeVariants = extractUnionValues(tsContent, "StrokeVariant");
  const allVariants = [
    ...new Set([...surfaceVariants, ...contentVariants, ...strokeVariants]),
  ];

  const categoryVariantMap = {
    surface: surfaceVariants,
    content: contentVariants,
    stroke: strokeVariants,
  };

  console.log("\n🔍 COLOR AUDIT: Checking for Broken Styles... (TS -> CSS)");
  Object.entries(categoryVariantMap).forEach(([category, variantList]) => {
    variantList.forEach((variant) => {
      const expectedToken = `--color-${category}-${variant}`;

      if (!cssContent.includes(expectedToken)) {
        console.error(
          `❌ BROKEN COLOR STYLE: ${variant} defined in TS, but ${expectedToken} is missing in CSS`,
        );
        errorCount++;
      }
    });
  });

  console.log("\n🔍 COLOR AUDIT: hecking for Ghost Tokens... (CSS -> TS)");
  const cssTokens =
    cssContent.match(/--color-(surface|content|stroke)-[\w-]+/g) || [];

  cssTokens.forEach((token) => {
    const variant = token.split("-").pop();

    if (!allVariants.includes(variant)) {
      console.warn(
        `⚠️ GHOST TOKEN: ${token} exists in CSS but is not defined in color types(TS)`,
      );
    }
  });

  return errorCount === 0;
}

if (runColorAudit()) {
  console.log(
    "\n✅ COLOR AUDIT SUCCESS: Color Foundation is perfectly synced.",
  );
  process.exit(0);
} else {
  console.error("\n🚨 COLOR AUDIT FAILED: Fix the broken styles");
  process.exit(1);
}
