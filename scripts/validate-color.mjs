import fs from "fs";
import path from "path";

const CSS_PATH = path.resolve("./packages/ui/src/index.css");
const COLOR_TS_PATH = path.resolve("./packages/ui/src/types/color.ts");

export function runColorAudit() {
  const cssContent = fs.readFileSync(CSS_PATH, "utf-8");
  const tsContent = fs.readFileSync(COLOR_TS_PATH, "utf-8");

  let errorCount = 0;

  // hardcoded variants and categories will be replaced in future
  const variants = ["primary", "secondary", "tertiary", "quaternary"];
  const categories = ["surface", "content", "stroke"];

  console.log("\n 🔍 Checking for Broken Styles... (TS -> CSS)");
  vsariant.forEach((variant) => {
    categories.forEach((category) => {
      // Stroke only goes up to tertiary in current types
      if (category === "stroke" && variant === "quaternary") return;

      const expectedToken = `--color-${category}-${variant}`;

      if (!cssContent.includes(expectedToken)) {
        console.error(
          `❌ BROKEN COLOR STYLE: ${variant} defined in TS, but ${expectedToken} is missing in CSS`,
        );
        errorCount++;
      }
    });
  });

  console.log("\n 🔍 Checking for Ghost Tokens... (CSS -> TS)");
  const cssTokens =
    cssContent.match(/--color-(surface|content|stroke)-[\w-]+/g) || [];

  cssTokens.forEach((token) => {
    const variant = token.split("-").pop();

    if (!variants.includes(variant)) {
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
