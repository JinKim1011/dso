"use client";

import { createElement, useMemo, useState } from "react";
import { TokenTypsNode } from "./components/TokenTypeNode";
import { TokenGraphModel } from "./lib/manifestAdapter";
import { mapTokenGraphToFlow } from "./lib/mapToFlow";

type TokensViewProps = {
  model: TokenGraphModel;
};

export function TokensView({ model }: TokensViewProps) {
  const { nodes, edges } = useMemo(() => {
    return mapTokenGraphToFlow(model);
  }, [model]);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return model.tokenTypes.flatMap((tokenType) =>
      tokenType.values.map((valueItem) => ({
        id: valueItem.id,
        name: valueItem.name,
        cssVar: valueItem.cssVar,
        meta: valueItem.meta,
      })),
    );
  }, [model]);

  const groups = useMemo(() => {
    return model.tokenTypes.map((tokenType) => ({
      id: tokenType.id,
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      values: tokenType.values,
    }));
  }, [model]);

  const categories = useMemo(() => {
    return model.categories.map((category) => ({
      id: category.id,
      category: category.category,
      tokenTypeIds: category.tokenTypeIds,
    }));
  }, [model]);

  const root = useMemo(() => {
    return model.root;
  }, [model]);

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
        { "data-testid": category.id, key: category.id },
        createElement("h2", null, category.category),
        ...categoryGroups.map((group) =>
          createElement(TokenTypsNode, {
            key: group.id,
            group,
            selectedRowId,
            onSelectRow: setSelectedRowId,
          }),
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
