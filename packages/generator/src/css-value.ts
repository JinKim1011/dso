import { TokensCssRenderError } from "@repo/generator/errors";

const CSS_CUSTOM_PROPERTY_PATTERN = /^--[A-Za-z0-9_-]+$/u;
const CSS_CLASS_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/u;

function hasBalancedParentheses(value: string): boolean {
  let depth = 0;

  for (const character of value) {
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }

  return depth === 0;
}

export function assertCssCustomPropertyName(cssVar: string, tokenId: string): void {
  if (!CSS_CUSTOM_PROPERTY_PATTERN.test(cssVar)) {
    throw new TokensCssRenderError(
      "invalid-css-var",
      `Token "${tokenId}" has an unsafe CSS custom property name.`,
      tokenId,
    );
  }
}

export function assertCssClassSegment(value: string, tokenId: string): void {
  if (!CSS_CLASS_SEGMENT_PATTERN.test(value)) {
    throw new TokensCssRenderError(
      "invalid-class-name",
      `Token "${tokenId}" cannot produce a safe typography class name.`,
      tokenId,
    );
  }
}

export function assertCssPrimitiveValue(value: string, tokenId: string): void {
  const unsafe =
    value.length === 0 ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    /[;{}\\]/u.test(value) ||
    /\/\*|\*\//u.test(value) ||
    /@import\b/iu.test(value) ||
    /\b(?:url|var)\s*\(/iu.test(value);

  if (unsafe || !hasBalancedParentheses(value)) {
    throw new TokensCssRenderError(
      "unsafe-css-value",
      `Token "${tokenId}" has an unsafe CSS value.`,
      tokenId,
    );
  }
}

export function assertCssSemanticAlias(value: string, tokenId: string): void {
  const match = /^var\((--[A-Za-z0-9_-]+)\)$/u.exec(value);

  if (!match) {
    throw new TokensCssRenderError(
      "unsafe-css-value",
      `Token "${tokenId}" has an unsafe CSS reference value.`,
      tokenId,
    );
  }

  assertCssCustomPropertyName(match[1]!, tokenId);
}
