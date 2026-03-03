export function extractUnionValues(tsContent, typeName) {
  const typePattern = new RegExp(
    `export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`,
  );

  const match = tsContent.match(typePattern);

  // for safety check : prevents crashes when a type doesn't exist
  if (!match) return [];

  const typeBlock = match[1];
  const literalPattern = /"([^"]+)"/g;

  return [...typeBlock.matchAll(literalPattern)].map((m) => m[1]);
}

export function extractCompositeStyles(tsContent, styleName) {
  const escapedStyleName = styleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stylePattern = new RegExp(
    `export\\s+const\\s+${escapedStyleName}\\s*:[\\s\\S]*?=\\s*\\{([\\s\\S]*?)\\};`,
  );

  const match = tsContent.match(stylePattern);

  if (!match) return [];

  const styleBlock = match[1];
  const entryPattern = /["']([^"']+)["']\s*:\s*["']([^"']+)["']/g;

  return [...styleBlock.matchAll(entryPattern)].map((entry) => {
    const [, variant, classString] = entry;

    return {
      variant,
      classes: classString.split(/\s+/).filter(Boolean),
    };
  });
}
