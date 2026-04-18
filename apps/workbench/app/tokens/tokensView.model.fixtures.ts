export const tokensViewModelFixture = {
  schemaVersion: 1,
  root: { id: "root", label: "Design Tokens" },
  categories: [
    {
      id: "category:spacing",
      category: "spacing",
      tokenTypeIds: ["token-type:spacing-step-primitive"],
    },
    {
      id: "category:color",
      category: "color",
      tokenTypeIds: ["token-type:color-background-primitive"],
    },
  ],
  tokenTypes: [
    {
      id: "token-type:spacing-step-primitive",
      category: "spacing",
      type: "step",
      kind: "primitive",
      values: [
        {
          id: "token-type:spacing-step-primitive:value:name-small:0",
          name: "small",
          cssVar: "--spacing-small",
          meta: "0.5rem",
        },
        {
          id: "token-type:spacing-step-primitive:value:name-regular:1",
          name: "regular",
          cssVar: "--spacing-regular",
          meta: "0.75rem",
        },
      ],
    },
    {
      id: "token-type:color-background-primitive",
      category: "color",
      type: "background",
      kind: "primitive",
      values: [
        {
          id: "token-type:color-background-primitive:value:name-primary:0",
          name: "primary",
          cssVar: "--bg-primary",
          meta: "light:oklch(1 0 89.9) dark:oklch(0.132 0.036 276.6)",
        },
        {
          id: "token-type:color-background-primitive:value:name-secondary:1",
          name: "secondary",
          cssVar: "--bg-secondary",
          meta: "light:oklch(0.985 0.002 247.8) dark:oklch(0.172 0.038 274.6)",
        },
      ],
    },
  ],
};
