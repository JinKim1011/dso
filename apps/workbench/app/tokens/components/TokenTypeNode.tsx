"use client";

import { createElement } from "react";
import type { TokenGraphModel } from "../lib/manifestAdapter";

type TokenTypeGroup = {
  id: string;
  type: string;
  kind: TokenGraphModel["tokenTypes"][number]["kind"];
  values: TokenGraphModel["tokenTypes"][number]["values"];
};

type TokenTypeNodeProps = {
  group: TokenTypeGroup;
  selectedRowId: string | null;
  onSelectRow: (rowId: string) => void;
};

export function TokenTypeNode({ group, selectedRowId, onSelectRow }: TokenTypeNodeProps) {
  return createElement(
    "section",
    { "data-testid": group.id, key: group.id },
    createElement("h3", null, `${group.type}(${group.kind})`),
    createElement(
      "ul",
      null,
      ...group.values.map((valueItem) =>
        createElement(
          "li",
          { key: valueItem.id },
          createElement(
            "button",
            {
              "aria-pressed": selectedRowId === valueItem.id,
              onClick: () => onSelectRow(valueItem.id),
            },
            valueItem.name,
          ),
        ),
      ),
    ),
  );
}
