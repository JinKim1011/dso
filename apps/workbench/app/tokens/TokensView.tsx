"use client";

import { useMemo, useState } from "react";
import { CategoryNode } from "./components/CategoryNode";
import { RootNode } from "./components/RootNode";
import { TokenTypeNode } from "./components/TokenTypeNode";
import { TokenValueDetail } from "./components/TokenValueDetail";
import { TokenTypeModel } from "./lib/manifest/types";
import type { TokenGraphModel } from "./lib/manifestAdapter";
import { mapTokenGraphToFlow } from "./lib/mapToFlow";

type TokensViewProps = {
  model: TokenGraphModel;
};

type TokenRow = Pick<
  TokenGraphModel["tokenTypes"][number]["values"][number],
  "id" | "name" | "cssVar" | "meta"
>;

function useTokensViewData(model: TokenGraphModel) {
  const root = useMemo(() => {
    return model.root;
  }, [model]);

  const categories = useMemo(() => {
    return model.categories.map((category) => ({
      id: category.id,
      category: category.category,
      tokenTypeIds: category.tokenTypeIds,
    }));
  }, [model]);

  const groups = useMemo<TokenTypeModel[]>(() => {
    return model.tokenTypes.map((tokenType) => ({
      id: tokenType.id,
      category: tokenType.category,
      type: tokenType.type,
      kind: tokenType.kind,
      values: tokenType.values,
    }));
  }, [model]);

  const groupById = useMemo(() => {
    return new Map(groups.map((group) => [group.id, group]));
  }, [groups]);

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

  return { rows, groups, categories, groupById, root };
}

function useTokenSelection(rows: TokenRow[]) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedRowId) ?? null;

  return { selectedRowId, setSelectedRowId, selected };
}

export function TokensView({ model }: TokensViewProps) {
  const flow = useMemo(() => {
    return mapTokenGraphToFlow(model);
  }, [model]);

  const { categories, groupById, root, rows } = useTokensViewData(model);
  const { selectedRowId, setSelectedRowId, selected } = useTokenSelection(rows);

  return (
    <>
      <RootNode label={root.label}>
        {categories.map((category) => {
          const categoryGroups = category.tokenTypeIds
            .map((id) => groupById.get(id))
            .filter((group): group is TokenTypeModel => !!group);

          return (
            <CategoryNode
              key={category.id}
              label={category.category}
              testId={category.id}
            >
              {categoryGroups.map((group) => (
                <TokenTypeNode
                  key={group.id}
                  group={group}
                  selectedRowId={selectedRowId}
                  onSelectRow={setSelectedRowId}
                />
              ))}
            </CategoryNode>
          );
        })}
      </RootNode>

      {selected && (
        <TokenValueDetail
          name={selected.name}
          cssVar={selected.cssVar}
          meta={selected.meta}
        />
      )}
    </>
  );
}
