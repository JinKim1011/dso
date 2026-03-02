import fs from "fs";
import path from "path";
import { extractUnionValues } from "./lib/typeParser.mjs";

const CSS_PATH = path.resolve("./packages/ui/src/index.css");
const TYPOGRAPHY_TS_PATH = path.resolve(
  "./packages/ui/src/types/typography.ts",
);

export function runTypographyAudit() {
  const cssContent = fs.readFileSync(CSS_PATH, "utf-8");
  const tsContent = fs.readFileSync(TYPOGRAPHY_TS_PATH, "utf-8");

  let errorCount = 0;

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
