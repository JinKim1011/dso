import type { TokenGraphModel } from "../../../tokens/_shared/lib/manifestAdapter";

export function makeStagedViewFixture(): TokenGraphModel {
  return {
    schemaVersion: 1,
    root: { id: "root", label: "Design Tokens" },
    categories: [
      {
        id: "category:color",
        category: "color",
        tokenTypeIds: ["token-type:color-background-primitive"],
      },
      {
        id: "category:spacing",
        category: "spacing",
        tokenTypeIds: ["token-type:spacing-step-primitive"],
      },
    ],
    tokenTypes: [
      {
        id: "token-type:color-background-primitive",
        category: "color",
        type: "background",
        kind: "primitive",
        values: [
          {
            id: "token-type:color-background-primitive:value:name:primary:0",
            name: "primary",
            cssVar: "--bg-primary",
            meta: "light:oklch(1 0 89.9) dark:oklch(0.132 0.036 276.6)",
            preview: {
              kind: "color",
              light: "oklch(1 0 89.9)",
              dark: "oklch(0.132 0.036 276.6)",
            },
            value: {
              light: "oklch(1 0 89.9)",
              dark: "oklch(0.132 0.036 276.6)",
            },
          },
          {
            id: "token-type:color-background-primitive:value:name:secondary:1",
            name: "secondary",
            cssVar: "--bg-secondary",
            meta: "light:oklch(0.985 0.002 247.8) dark:oklch(0.172 0.038 274.6)",
            preview: {
              kind: "color",
              light: "oklch(0.985 0.002 247.8)",
              dark: "oklch(0.172 0.038 274.6)",
            },
            value: {
              light: "oklch(0.985 0.002 247.8)",
              dark: "oklch(0.172 0.038 274.6)",
            },
          },
          {
            id: "token-type:color-background-primitive:value:name:tertiary:2",
            name: "tertiary",
            cssVar: "--bg-tertiary",
            meta: "light:oklch(0.957 0.007 260.7) dark:oklch(0.222 0.043 274.5)",
            preview: {
              kind: "color",
              light: "oklch(0.957 0.007 260.7)",
              dark: "oklch(0.222 0.043 274.5)",
            },
            value: {
              light: "oklch(0.957 0.007 260.7)",
              dark: "oklch(0.222 0.043 274.5)",
            },
          },
          {
            id: "token-type:color-background-primitive:value:name:quaternary:3",
            name: "quaternary",
            cssVar: "--bg-quaternary",
            meta: "light:oklch(0.928 0.013 266.7) dark:oklch(0.275 0.049 271.4)",
            preview: {
              kind: "color",
              light: "oklch(0.928 0.013 266.7)",
              dark: "oklch(0.275 0.049 271.4)",
            },
            value: {
              light: "oklch(0.928 0.013 266.7)",
              dark: "oklch(0.275 0.049 271.4)",
            },
          },
        ],
      },
      {
        id: "token-type:spacing-step-primitive",
        category: "spacing",
        type: "step",
        kind: "primitive",
        values: [
          {
            id: "token-type:spacing-step-primitive:value:name:micro:0",
            name: "micro",
            cssVar: "--spacing-micro",
            meta: "0.125rem",
            preview: { kind: "spacing", value: "0.125rem" },
            value: "0.125rem",
          },
          {
            id: "token-type:spacing-step-primitive:value:name:mini:1",
            name: "mini",
            cssVar: "--spacing-mini",
            meta: "0.25rem",
            preview: { kind: "spacing", value: "0.25rem" },
            value: "0.25rem",
          },
          {
            id: "token-type:spacing-step-primitive:value:name:small:2",
            name: "small",
            cssVar: "--spacing-small",
            meta: "0.5rem",
            preview: { kind: "spacing", value: "0.5rem" },
            value: "0.5rem",
          },
          {
            id: "token-type:spacing-step-primitive:value:name:regular:3",
            name: "regular",
            cssVar: "--spacing-regular",
            meta: "0.75rem",
            preview: { kind: "spacing", value: "0.75rem" },
            value: "0.75rem",
          },
        ],
      },
    ],
  };
}
