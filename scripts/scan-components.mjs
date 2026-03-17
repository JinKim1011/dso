import * as docgen from "react-docgen-typescript";
import fs from "fs";
import path from "path";
import { globSync } from "glob";

const COMPONENTS_PATH = path.resolve("./packages/ui/src/components");
const OUTPUT_PATH = path.resolve("./design-components-manifest.json");

const componentFiles = globSync(`${COMPONENTS_PATH}/**/*.tsx`);

const parser = docgen.withDefaultConfig({
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  shouldExtractValuesFromUnion: true,
  propFilter: (prop) => {
    if (prop.parent) {
      return !prop.parent.fileName.includes("@types/react");
    }
    return true;
  },
});

const manifest = componentFiles
  .flatMap((file) => {
    const docs = parser.parse(file) || [];

    return docs.map((doc) => {
      if (!doc) return doc;

      const normalizedFilePath =
        doc.filePath != null
          ? path.relative(process.cwd(), doc.filePath)
          : doc.filePath;

      return {
        ...doc,
        filePath: normalizedFilePath,
      };
    });
  })
  .filter(Boolean);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
