import fs from "fs";
import path from "path";
import {
  extractUnionValues,
  extractTypographyRecipes,
} from "./lib/typeParser.mjs";

const CSS_PATH = path.resolve("./packages/ui/src/index.css");
const TYPOGRAPHY_TS_PATH = path.resolve(
  "./packages/ui/src/types/typography.ts",
);

export function runTypographyAudit() {
  const cssContent = fs.readFileSync(CSS_PATH, "utf-8");
  const tsContent = fs.readFileSync(TYPOGRAPHY_TS_PATH, "utf-8");

  let errorCount = 0;

  const RULES = [
    {
      classPrefix: "text-",
      tsType: "FontSizeStep",
      cssVariablePrefix: "--text-",
      label: "size",
    },
    {
      classPrefix: "font-",
      tsType: "FontWeightStep",
      cssVariablePrefix: "--font-",
      label: "weight",
    },
    {
      classPrefix: "leading-",
      tsType: "LineHeightStep",
      cssVariablePrefix: "--leading-",
      label: "line-height",
    },
  ];

  const tokenByType = Object.fromEntries(
    RULES.map((rule) => [
      rule.tsType,
      extractUnionValues(tsContent, rule.tsType),
    ]),
  );

  const tokenSetsByType = Object.fromEntries(
    Object.entries(tokenByType).map(([type, values]) => [
      type,
      new Set(values),
    ]),
  );

  console.log(
    "\n🔍 TYPOGRAPHY AUDIT: Checking for Broken Styles... (TS -> CSS)",
  );

  for (const rule of RULES) {
    for (const token of tokenByType[rule.tsType]) {
      const expected = `${rule.cssVariablePrefix}${token}`;
      if (!cssContent.includes(expected)) {
        console.error(
          `❌ MISSING TYPOGRAPHY VARIABLES: ${token} in ${rule.tsType}, missing ${expected} in CSS`,
        );
        errorCount++;
      }
    }
  }

  console.log("\n🔍 TYPOGRAPHY AUDIT: Checking for Broken Composite styles...");

  const recipeStyles = extractTypographyRecipes(tsContent, "typographyRecipes");

  for (const recipe of recipeStyles) {
    const { variant, fontSize, fontWeight, lineHeight } = recipe;
    const propertiesToCheck = [
      { value: fontSize, property: "FontSizeStep" },
      { value: fontWeight, property: "FontWeightStep" },
      { value: lineHeight, property: "LineHeightStep" },
    ];

    for (const { value, property } of propertiesToCheck) {
      if (!value) continue;

      const rule = RULES.find((r) => r.tsType === property);
      const isValid = tokenSetsByType[property].has(value);

      if (!isValid) {
        console.error(
          `❌ TYPOGRAPHY COMPOSITE STYLE DRIFT: ${variant} unknown ${rule.label} "${value}"`,
        );
        errorCount++;
      }
    }
  }
  return errorCount === 0;
}

if (runTypographyAudit()) {
  console.log(
    "\n✅ TYPOGRAPHY AUDIT SUCCESS: TYPOGRAPHY Foundation is perfectly synced.",
  );
  process.exit(0);
} else {
  console.error("\n🚨 TYPOGRAPHY AUDIT FAILED: Fix the broken styles");
  process.exit(1);
}
