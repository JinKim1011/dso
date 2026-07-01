import { useMemo } from "react";
import type { TokenTypographyOptions } from "../typography/components/TokenTypographyForm";
import type { TokenGraphModel } from "./manifestAdapter";

type UseTypographyOptionsProps = {
  draftModel: TokenGraphModel;
};

export function useTypographyOptions({
  draftModel,
}: UseTypographyOptionsProps): TokenTypographyOptions {
  return useMemo(() => {
    const fontSize = new Set<string>();
    const fontWeight = new Set<string>();
    const lineHeight = new Set<string>();

    draftModel.tokenTypes
      .filter(
        (tokenType) =>
          tokenType.category === "typography" && tokenType.kind === "primitive",
      )
      .forEach((tokenType) => {
        const typeName = tokenType.type.toLowerCase();

        for (const valueItem of tokenType.values) {
          if (!valueItem.name) continue;

          if (typeName.includes("fontsize")) {
            fontSize.add(valueItem.name);
            continue;
          }

          if (typeName.includes("fontweight")) {
            fontWeight.add(valueItem.name);
            continue;
          }

          if (typeName.includes("lineheight")) {
            lineHeight.add(valueItem.name);
          }
        }
      });

    return {
      fontSize: [...fontSize].sort(),
      fontWeight: [...fontWeight].sort(),
      lineHeight: [...lineHeight].sort(),
    };
  }, [draftModel]);
}
