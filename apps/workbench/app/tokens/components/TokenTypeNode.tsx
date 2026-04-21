"use client";

import type { TokenGraphModel } from "../lib/manifestAdapter";

export type TokenTypeGroup = {
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
  const listItems = group.values.map((valueItem, index) => ({
    id: valueItem.id,
    text: valueItem.name,
    subText: valueItem.cssVar,
    level: 2, // hard-coded for now, will be integarte with component used freqeucny level
    selected: selectedRowId === valueItem.id,
    onSelect: () => onSelectRow(valueItem.id),
    index: String(index),
  }));

  return (
    <section data-testid={group.id} key={group.id}>
      <h3>
        {group.type}({group.kind})
      </h3>
      <ul>
        {group.values.map((valueItem) => (
          <li key={valueItem.id}>
            <button
              aria-pressed={selectedRowId === valueItem.id}
              onClick={() => onSelectRow(valueItem.id)}
            >
              {valueItem.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
