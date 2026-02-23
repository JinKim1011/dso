import fs from "fs";
import path from "path";

const CSS_PATH = path.resolve("./packages/ui/src/index.css");
const COLOR_TS_PATH = path.resolve("./packages/ui/src/types/color.ts");

export function runColorAudit() {
  const cssContent = fs.readFileSync(CSS_PATH, "utf-8");
  const tsContent = fs.readFileSync(COLOR_TS_PATH, "utf-8");

  const rules = [
    { cssPrefix: "--color-surface-", typeName: "SurfaceVariant" },
    { cssPrefix: "--color-content-", typeName: "ContentVariant" },
    { cssPrefix: "--color-stroke-", typeName: "StrokeVariant" },
  ];

  const errors = [];

  rules.forEach(({ cssPrefix, typeName }) => {
    const regex = new Regex(`export type ${typeName} = ([\\s\\S]*?);`);
    const match = tsContent.match(regex);

    if (match) {
      const variants = match[1]
        .replace(/['"|\s]/g, " ")
        .trim()
        .split(/\s+/);
    }

    variants.forEach((variant) => {
      const expectedVariables = `${cssPrefix}${variant}`;
      if (!cssContent.includes(expectedVariables)) {
        errors.push(
          `❌ Type ${typeName} includes ${variant}, but CSS is missing equivalent of ${expectedVariables}`,
        );
      }
    });
    return { isValid: errors.length === 0, errors };
  });

  const audit = runColorAudit();

  if (audit.isValid) {
    console.log(
      "✅ Color Audit Passed: Typescript and CSS variables are in sync",
    );
  } else {
    console.error("⚠️ Color Audit Failed: ");
    audit.errors.forEach((error) => console.error(error));
    process.exit(1);
  }
}
