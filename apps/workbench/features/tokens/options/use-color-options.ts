import type {
  TokenGraphViewModel,
  TokenReferenceOption,
} from "@/features/tokens/model/token-graph";
import { useMemo } from "react";

export function useColorOptions(draftModel: TokenGraphViewModel): TokenReferenceOption[] {
  return useMemo(
    () =>
      draftModel.tokenTypes
        .filter((type) => type.category === "color" && type.kind === "primitive")
        .flatMap((type) =>
          type.values.flatMap((token) =>
            token.value.kind === "single"
              ? [
                  {
                    value: token.id,
                    label: token.name,
                    resolvedValue: token.value.value,
                    cssVar: token.cssVar,
                  },
                ]
              : [],
          ),
        )
        .sort((a, b) => a.label.localeCompare(b.label)),
    [draftModel],
  );
}
