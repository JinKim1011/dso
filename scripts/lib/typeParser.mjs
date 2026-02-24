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
