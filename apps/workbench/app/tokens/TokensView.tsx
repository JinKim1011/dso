"use client";

import { useMemo, useState } from "react";
import { CategoryNode } from "./components/CategoryNode";
import { RootNode } from "./components/RootNode";
import { TokenTypeNode, type TokenTypeGroup } from "./components/TokenTypeNode";
import { TokenValueDetail } from "./components/TokenValueDetail";
import type { TokenGraphModel } from "./lib/manifestAdapter";

type TokensViewProps = {
  model: TokenGraphModel;
};

export function TokensView({ model }: TokensViewProps) {
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
    return model.tokenTypes.map(
      (tokenType) =>
        ({
          id: tokenType.id,
          category: tokenType.category,
          type: tokenType.type,
          kind: tokenType.kind,
          values: tokenType.values,
        }) as TokenTypeGroup,
    );
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

  return (
    <>
      <RootNode label={root.label}>
        {categories.map((category) => {
          const categoryGroups = category.tokenTypeIds
            .map((id) => groupById.get(id))
            .filter((group): group is TokenTypeGroup => !!group);

          return (
            <CategoryNode key={category.id} category={category}>
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
