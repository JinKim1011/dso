import type {
  TokenTypeViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import { TokenReferenceSlot } from "@repo/contracts/type";
import { TokenCategory } from "@repo/contracts/validation/enum";

export type SlotContext = {
  row: TokenValueViewModel;
  baseRow?: TokenValueViewModel;
  previousRow?: TokenValueViewModel;
  category: TokenCategory;
  draftRows: Map<string, { row: TokenValueViewModel; type: TokenTypeViewModel }>;
};

type SlotResult = { value: string | undefined; label: string; missing: boolean };

const typographyTypes = {
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
} as const;

const hasVarFunction = (variable: string) => /\bvar\s*\(/i.test(variable);

function isReferenceValid(
  context: SlotContext,
  target: { row: TokenValueViewModel; type: TokenTypeViewModel } | undefined,
  slot: TokenReferenceSlot,
): target is NonNullable<typeof target> {
  if (!target || target.row.id === context.row.id) return false;
  if (target.type.kind !== "primitive") return false;
  if (target.type.category !== context.category) return false;
  if (target.row.value.kind !== "single") return false;
  if (hasVarFunction(target.row.value.value)) return false;

  const expected =
    slot in typographyTypes
      ? typographyTypes[slot as keyof typeof typographyTypes]
      : undefined;

  return expected === undefined || target.type.type === expected;
}

export function resolveSlot(
  context: SlotContext,
  slot: TokenReferenceSlot,
  literal: string | undefined,
): SlotResult {
  const targetId = context.row.references?.[slot];

  if (!targetId) {
    if (context.baseRow?.references?.[slot] || context.previousRow?.references?.[slot]) {
      return { value: undefined, label: "unset", missing: false };
    }

    if (literal && /\bvar\s*\(/i.test(literal)) {
      return { value: undefined, label: "unavailable", missing: true };
    }

    return { value: literal, label: literal ?? "unset", missing: false };
  }

  const target = context.draftRows.get(targetId);

  if (!isReferenceValid(context, target, slot) || target.row.value.kind !== "single") {
    return { value: undefined, label: "unavailable", missing: true };
  }

  return { value: target.row.value.value, label: target.row.name, missing: false };
}

type TypographyValue = Extract<TokenValueViewModel["value"], { kind: "typography" }>;

export function resolveTypography(context: SlotContext, value: TypographyValue) {
  const fontSize = resolveSlot(context, "fontSize", value.fontSize);
  const fontWeight = resolveSlot(context, "fontWeight", value.fontWeight);
  const lineHeight = resolveSlot(context, "lineHeight", value.lineHeight);

  const complete =
    fontSize.value !== undefined &&
    fontWeight.value !== undefined &&
    lineHeight.value !== undefined;

  return {
    meta: [fontSize.label, fontWeight.label, lineHeight.label].join(" / "),
    preview:
      fontSize.value !== undefined &&
      fontWeight.value !== undefined &&
      lineHeight.value !== undefined
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

type ModesValue = Extract<TokenValueViewModel["value"], { kind: "modes" }>;

export function resolveModes(context: SlotContext, value: ModesValue) {
  const light = resolveSlot(context, "light", value.light);
  const dark = resolveSlot(context, "dark", value.dark);

  const complete = light.value !== undefined && dark.value !== undefined;

  return {
    meta: `${light.label} / ${dark.label}`,
    preview:
      light.value !== undefined && dark.value !== undefined
        ? { kind: "modes" as const, light: light.value, dark: dark.value }
        : undefined,
    incomplete: !complete,
    missing: light.missing || dark.missing,
  };
}
