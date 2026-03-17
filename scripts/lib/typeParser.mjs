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

export function extractTypographyReciepes(tsContent, styleName) {
  const escaped = styleName.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    "export\s+const\s+" + escaped + "\s:[\s\S]?=\s\{([\s\S]*?)\};",
  );

  const rootMatch = tsContent.match(pattern);
  if (!rootMatch) return [];

  const block = rootMatch[1];
  const entryPattern = /"'["']\s*:\s*\{([\s\S]*?)\}\s*,?/g;

  return [...block.matchAll(entryPattern)].map((entry) => {
    const variant = entry[1];
    const body = entry[2];

    const fontSizeMatch = body.match(/fontSize\s*:\s*"'["']/);
    const fontWeightMatch = body.match(/fontWeight\s*:\s*"'["']/);
    const lineHeightMatch = body.match(/lineHeight\s*:\s*"'["']/);

    return {
      variant,
      fontSize: fontSizeMatch ? fontSizeMatch[1] : null,
      fontWeight: fontWeightMatch ? fontWeightMatch[1] : null,
      lineHeight: lineHeightMatch ? lineHeightMatch[1] : null,
    };
  });
}
