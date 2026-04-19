"use client";

import { createElement, useMemo, useState } from "react";
import { tokensViewModelFixture } from "./tokensView.model.fixtures";

export function TokensView() {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return tokensViewModelFixture.tokenTypes.flatMap((tokenType) =>
      tokenType.values.map((valueItem) => ({
        id: valueItem.id,
        name: valueItem.name,
        cssVar: valueItem.cssVar,
        meta: valueItem.meta,
      })),
    );
  }, []);

  const groups = useMemo(() => {
    return tokensViewModelFixture.tokenTypes.map((tokenType) => ({
      id: tokenType.id,
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      values: tokenType.values,
    }));
  }, []);

  const selected = rows.find((row) => row.id === selectedRowId) ?? null;

  return createElement(
    "section",
    null,
    ...groups.map((group) =>
      createElement(
        "section",
        { "data-testid": group.id },
        createElement("h2", null, `${group.type}(${group.kind})`),
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
                  onClick: () => setSelectedRowId(valueItem.id),
                },
                valueItem.name,
              ),
            ),
          ),
        ),
      ),
    ),
    selected
      ? createElement(
          "div",
          null,
          createElement("p", null, `selected: ${selected.name}`),
          createElement("p", null, `cssVar: ${selected.cssVar}`),
          createElement("p", null, `meta: ${selected.meta}`),
        )
      : null,
  );
}
