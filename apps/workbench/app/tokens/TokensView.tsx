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

  const selected = rows.find((row) => row.id === selectedRowId) ?? null;

  return createElement(
    "section",
    null,
    createElement("h1", null, "hello"),
    ...rows.map((row) =>
      createElement(
        "button",
        {
          key: row.id,
          "aria-pressed": selectedRowId === row.id,
          onClick: () => setSelectedRowId(row.id),
        },
        row.name,
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
