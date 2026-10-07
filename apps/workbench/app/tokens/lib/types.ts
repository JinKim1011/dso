export type TokenRowViewModel = {
  id: string;
  name: string;
  cssVar?: string;
  meta?: string;
  preview?: TokenRowPreview;
  category: string;
  kind: string;
  value: TokenRowValue;
};

type TokenRowValue = {
  name: string;
  rawValue?: string | { light?: string; dark?: string };
};

type TokenRowPreview =
  | {
      kind: "typography";
      typography: {
        fontSize: string;
        fontWeight: string;
        lineHeight: string;
      };
    }
  | {
      kind: "color";
      light?: string;
      dark?: string;
    }
  | {
      kind: "spacing";
      value: string;
    };
