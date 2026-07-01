import type { TokenGraphModel } from "./manifest/types";

export type TokenRow = {
  id: string;
  name: string;
  cssVar?: string;
  meta?: string;
  preview?: TokenGraphModel["tokenTypes"][number]["values"][number]["preview"];
  category: string;
  kind: string;
  value: TokenGraphModel["tokenTypes"][number]["values"][number];
};