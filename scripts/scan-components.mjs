import * as docgen from "react-docgen-typescript";
import fs from "fs";
import path from "path";
import { globSync } from "glob";

const COMPONENTS_PATH = path.resolve("./packages/ui/src/components");
const OUTPUT_PATH = path.resolve("./manifest.json");

const componentFiles = globSync(`${COMPONENTS_PATH}/**/*.tsx`);

const parser = docgen.withDefaultConfig({
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  propFilter: (prop) => {
    if (prop.parent) {
      return !prop.parent.fileName.includes("@types/react");
    }
    return true;
  },
});

const manifest = componentFiles
  .map((file) => {
    return parser.parse(file)[0];
  })
  .filter(Boolean);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
