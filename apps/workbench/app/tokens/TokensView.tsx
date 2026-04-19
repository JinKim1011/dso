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

  const categories = useMemo(() => {
    return tokensViewModelFixture.categories.map((category) => ({
      id: category.id,
      category: category.category,
      tokenTypeIds: category.tokenTypeIds,
    }));
  }, []);

  const root = useMemo(() => {
    return tokensViewModelFixture.root;
  }, []);

  const selected = rows.find((row) => row.id === selectedRowId) ?? null;

  const groupById = useMemo(() => {
    return new Map(groups.map((group) => [group.id, group]));
  }, [groups]);

  return createElement(
    "section",
    null,
    createElement("h1", null, root.label),
    ...categories.map((category) => {
      const categoryGroups = category.tokenTypeIds
        .map((id) => groupById.get(id))
        .filter((group): group is NonNullable<typeof group> => Boolean(group));

      return createElement(
        "section",
        { "data-testid": category.id },
        createElement("h2", null, category.category),
        ...categoryGroups.map((group) =>
          createElement(
            "section",
            { "data-testid": group.id },
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
                      onClick: () => setSelectedRowId(valueItem.id),
                    },
                    valueItem.name,
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }),
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
