import type {
  TokenTypeViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import { TokenReferenceSlot } from "@repo/contracts/type";
import { TokenCategory } from "@repo/contracts/validation/enum";
import { containsCssVariable } from "@repo/contracts/validation/token-value";

export type SlotContext = {
  row: TokenValueViewModel;
  category: TokenCategory;
  draftRows: Map<string, { row: TokenValueViewModel; type: TokenTypeViewModel }>;
};

type SlotResult = { value: string | undefined; label: string; missing: boolean };

const typographyTypes = {
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
} as const;

function isReferenceValid(
  context: SlotContext,
  target: { row: TokenValueViewModel; type: TokenTypeViewModel } | undefined,
  slot: TokenReferenceSlot,
): target is NonNullable<typeof target> {
  if (!target || target.row.id === context.row.id) return false;
  if (target.type.kind !== "primitive") return false;
  if (target.type.category !== context.category) return false;
  if (target.row.value.kind !== "single") return false;
  if (containsCssVariable(target.row.value.value)) return false;

  const expected =
    slot in typographyTypes
      ? typographyTypes[slot as keyof typeof typographyTypes]
      : undefined;

  return expected === undefined || target.type.type === expected;
}

export function resolveSlot(context: SlotContext, slot: TokenReferenceSlot): SlotResult {
  const targetId = context.row.references?.[slot];

  if (!targetId) {
    return { value: undefined, label: "unset", missing: false };
  }

  const target = context.draftRows.get(targetId);

  if (!isReferenceValid(context, target, slot) || target.row.value.kind !== "single") {
    return { value: undefined, label: "unavailable", missing: true };
  }

  return { value: target.row.value.value, label: target.row.name, missing: false };
}

export function resolveTypography(context: SlotContext) {
  const fontSize = resolveSlot(context, "fontSize");
  const fontWeight = resolveSlot(context, "fontWeight");
  const lineHeight = resolveSlot(context, "lineHeight");

  const complete = !!fontSize.value && !!fontWeight.value && !!lineHeight.value;

  return {
    meta: [fontSize.label, fontWeight.label, lineHeight.label].join(" / "),
    preview:
      fontSize.value && fontWeight.value && lineHeight.value
        ? {
            kind: "typography" as const,
            typography: {
              fontSize: fontSize.value,
              fontWeight: fontWeight.value,
              lineHeight: lineHeight.value,
            },
          }
        : undefined,
    incomplete: !complete,
    missing: fontSize.missing || fontWeight.missing || lineHeight.missing,
  };
}

export function resolveModes(context: SlotContext) {
  const light = resolveSlot(context, "light");
  const dark = resolveSlot(context, "dark");

  const complete = !!light.value && !!dark.value;

  return {
    meta: `${light.label} / ${dark.label}`,
    preview:
      light.value || dark.value
        ? { kind: "modes" as const, light: light.value, dark: dark.value }
        : undefined,
    incomplete: !complete,
    missing: light.missing || dark.missing,
  };
}
