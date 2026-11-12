import type { TokenReferenceLookup } from "@/features/tokens/adapters/database/create-token-reference-lookup";
import {
  resolveModeToken,
  resolveTypographyToken,
} from "@/features/tokens/adapters/database/resolve-token-reference";
import type { TokenValueViewModel } from "@/features/tokens/model/token-graph";
import type { Token, TokenType } from "@repo/contracts/type";

type MappedTokenValue = Pick<
  TokenValueViewModel,
  "value" | "meta" | "preview" | "references"
>;

export function mapTokenValue(
  token: Token,
  tokenType: TokenType,
  referenceLookup: TokenReferenceLookup,
): MappedTokenValue {
  const category = tokenType.category;

  switch (token.value.kind) {
    case "single":
      return {
        value: token.value,
        meta: token.value.value,
        preview:
          category === "color" || category === "shadow"
            ? {
                kind: "single",
                value: token.value.value,
              }
            : undefined,
      };

    case "modes": {
      const previewValues =
        category === "color" || category === "shadow"
          ? resolveModeToken(token, tokenType, referenceLookup)
          : { light: undefined, dark: undefined };

      const lightReference = referenceLookup.find(token.id, "light");
      const darkReference = referenceLookup.find(token.id, "dark");
      const references = {
        ...(lightReference.kind === "found" ? { light: lightReference.token.id } : {}),
        ...(darkReference.kind === "found" ? { dark: darkReference.token.id } : {}),
      };

      return {
        value: { kind: "modes" },
        ...(Object.keys(references).length ? { references } : {}),
        meta: `${lightReference.kind === "found" ? lightReference.token.name : "unset"} / ${darkReference.kind === "found" ? darkReference.token.name : "unset"}`,
        preview:
          previewValues.light || previewValues.dark
            ? { kind: "modes", ...previewValues }
            : undefined,
      };
    }

    case "typography": {
      const previewValues =
        category === "typography"
          ? resolveTypographyToken(token, tokenType, referenceLookup)
          : { fontSize: undefined, fontWeight: undefined, lineHeight: undefined };

      const fontSizeReference = referenceLookup.find(token.id, "fontSize");
      const fontWeightReference = referenceLookup.find(token.id, "fontWeight");
      const lineHeightReference = referenceLookup.find(token.id, "lineHeight");

      const references = {
        ...(fontSizeReference.kind === "found"
          ? { fontSize: fontSizeReference.token.id }
          : {}),
        ...(fontWeightReference.kind === "found"
          ? { fontWeight: fontWeightReference.token.id }
          : {}),
        ...(lineHeightReference.kind === "found"
          ? { lineHeight: lineHeightReference.token.id }
          : {}),
      };

      return {
        value: { kind: "typography" },
        ...(Object.keys(references).length ? { references } : {}),
        meta: [fontSizeReference, fontWeightReference, lineHeightReference]
          .map((reference) =>
            reference.kind === "found" ? reference.token.name : "unset",
          )
          .join(" / "),
        preview:
          previewValues.fontSize && previewValues.fontWeight && previewValues.lineHeight
            ? {
                kind: "typography",
                typography: {
                  fontSize: previewValues.fontSize,
                  fontWeight: previewValues.fontWeight,
                  lineHeight: previewValues.lineHeight,
                },
              }
            : undefined,
      };
    }

    case "unresolved":
      return {
        value: token.value,
        meta: "unresolved",
      };
  }
}
