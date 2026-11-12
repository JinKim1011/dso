import type {
  TokenGraphViewModel,
  TokenReferenceOption,
  TypographyReferenceOptions,
} from "@/features/tokens/model/token-graph";
import { containsCssVariable } from "@repo/contracts/validation/token-value";
import { useMemo } from "react";

export function useTypographyOptions(
  draftModel: TokenGraphViewModel,
): TypographyReferenceOptions {
  return useMemo(() => {
    const options: TypographyReferenceOptions = {
      fontSize: [],
      fontWeight: [],
      lineHeight: [],
    };

    for (const type of draftModel.tokenTypes) {
      if (type.category !== "typography" || type.kind !== "primitive") {
        continue;
      }

      let target: TokenReferenceOption[];

      switch (type.type) {
        case "font-size":
          target = options.fontSize;
          break;
        case "font-weight":
          target = options.fontWeight;
          break;
        case "line-height":
          target = options.lineHeight;
          break;
        default:
          continue;
      }

      for (const token of type.values) {
        if (token.value.kind !== "single" || containsCssVariable(token.value.value))
          continue;

        target.push({
          value: token.id,
          label: token.name,
          resolvedValue: token.value.value,
          cssVar: token.cssVar,
        });
      }
    }

    for (const group of Object.values(options)) {
      group.sort((a, b) => a.label.localeCompare(b.label));
    }

    return options;
  }, [draftModel]);
}
