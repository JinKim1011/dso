import fs from "fs";
import path from "path";
import {
  extractCompositeStyles,
  extractUnionValues,
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
      lable: "weight",
    },
    {
      classPrefix: "leading-",
      tsType: "LineHeightStep",
      cssVariablePrefix: "--leading-",
      lable: "line-height",
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

  function findRule(className) {
    return RULES.find((rule) => className.startsWith(rule.classPrefix));
  }

  for (const { variant, classes } of compositeStyles) {
    for (const className of classes) {
      const rule = findRule(className);

      if (!rule) {
        console.error(
          `❌ TYPOGRAPHY COMPOSITE STYLE DRIFT: ${variant} illegal class format "${className}"`,
        );
        errorCount++;
        continue;
      }

      const value = className.slice(rule.classPrefix.length);
      const isValid = tokenSetsByType[rule.tsType].has(value);

      if (!isValid) {
        console.error(
          `❌ TYPOGRAPHY COMPOSITE STYLE DRIFT: ${variant} unknown ${rule.label} "${value}"`,
        );
        errorCount++;
      }
    }
  }

  const atomicChecks = [
    { type: "FontSizeStep", prefix: "--text-" },
    { type: "FontWeightStep", prefix: "--font-" },
    { type: "LineHeightStep", prefix: "--leading-" },
  ];

  console.log(
    "\n🔍 TYPOGRAPHY AUDIT: Checking for Broken Styles... (TS -> CSS)",
  );

  atomicChecks.forEach(({ type, prefix }) => {
    const tokens = extractUnionValues(tsContent, type);

    tokens.forEach((token) => {
      const expectedVariables = `${prefix}${token}`;

      if (!cssContent.includes(expectedVariables)) {
        console.error(
          `❌ MISSING TYPOGRAPHY VARIABLES: ${token} in ${type} defined in TS, but ${expectedVariables} is missing in CSS`,
        );
        errorCount++;
      }
    });
  });

  const fontSizeSteps = new Set(extractUnionValues(tsContent, "FontSizeStep"));
  const fontWeightSteps = new Set(
    extractUnionValues(tsContent, "FontWeightStep"),
  );
  const lineHeightSteps = new Set(
    extractUnionValues(tsContent, "LineHeightStep"),
  );

  console.log("\n🔍 TYPOGRAPHY AUDIT: Checking for Broken Composite styles...");

  const compositeStyles = extractCompositeStyles(tsContent, "typographyStyles");

  compositeStyles.forEach(({ variant, classes }) => {
    classes.forEach((className) => {
      let isValid = false;
      let errorMessage = "";

      if (className.startsWith("text-")) {
        const value = className.replace("text-", "");
        isValid = fontSizeSteps.has(value);
        errorMessage = `unknown size "${value}"`;
      } else if (className.startsWith("font-")) {
        const value = className.replace("font-", "");
        isValid = fontWeightSteps.has(value);
        errorMessage = `unknown weight "${value}"`;
      } else if (className.startsWith("leading-")) {
        const value = className.replace("leading-", "");
        isValid = lineHeightSteps.has(value);
        errorMessage = `unknown line-height "${value}"`;
      } else {
        errorMessage = `illegal class format "${className}"`;
      }

      if (!isValid) {
        console.error(
          `❌ TYPOGRAPHY COMPOSITE STYLE DRIFT: ${variant} ${errorMessage}`,
        );
        errorCount++;
      }
    });
  });

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
