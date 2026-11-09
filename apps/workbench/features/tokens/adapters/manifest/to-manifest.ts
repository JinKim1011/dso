import type { NormalizedManifestEntry } from "@/features/tokens/adapters/manifest/types";
import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";

export function buildManifestFromGraph(
  model: TokenGraphViewModel,
): NormalizedManifestEntry[] {
  const entries: NormalizedManifestEntry[] = [];

  for (const tokenType of model.tokenTypes) {
    const typographyValues = tokenType.values.filter(
      (value) => value.value.kind === "typography",
    );

    if (typographyValues.length === tokenType.values.length && typographyValues.length) {
      entries.push({
        category: tokenType.category,
        type: tokenType.type,
        kind: tokenType.kind,
        value: tokenType.values.map((value) => value.name),
        semanticMap: typographyValues.map((value) => {
          if (value.value.kind !== "typography") {
            throw new Error(`Unexpected non-typography value "${value.name}"`);
          }

          return {
            name: value.name,
            fontSize: value.value.fontSize,
            fontWeight: value.value.fontWeight,
            lineHeight: value.value.lineHeight,
          };
        }),
      });
      continue;
    }

    entries.push({
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      value: tokenType.values.map((value) => value.name),
      tokens: tokenType.values.map((value) => ({
        name: value.name,
        cssVar: value.cssVar,
        status: value.status,
        ...(value.value.kind === "single"
          ? { value: value.value.value }
          : value.value.kind === "modes"
            ? {
                values: {
                  light: value.value.light,
                  dark: value.value.dark,
                },
              }
            : {}),
      })),
    });
  }

  return entries;
}
