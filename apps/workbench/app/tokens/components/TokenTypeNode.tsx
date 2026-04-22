"use client";

import { DotsVerticalIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Button, List, Text } from "@repo/ui";
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
    subText: valueItem.meta,
    level: 2, // hard-coded for now, will be integrate with component used frequency level
    selected: selectedRowId === valueItem.id,
    onSelect: () => onSelectRow(valueItem.id),
    index: String(index),
  }));

  return (
    <section
      data-testid={group.id}
      key={group.id}
      className="bg-surface-primary gap-mini py-mini flex w-[20rem] flex-col"
    >
      <div className="pl-miniPlus pr-microPlus flex items-center justify-between">
        <Text as="h3" variant="label-sm" className="text-content-primary">
          {group.type}
        </Text>

        <div className="gap-microPlus flex items-center">
          <Text variant="label-xs" className="text-content-tertiary">
            {group.kind}
          </Text>
          {/* below button will be used for opening a listbox which contains edit and delete actions*/}
          <Button
            variant="void"
            size="sm"
            aria-label="more"
            iconOnly={true}
            leftIcon={DotsVerticalIcon}
          ></Button>
        </div>
      </div>
      <List listItems={listItems} />
      <div className="self-center">
        {/* Below button will be used for adding value action */}
        <Button
          variant="void"
          size="lg"
          aria-label="add"
          iconOnly={true}
          leftIcon={PlusCircledIcon}
        ></Button>
      </div>
    </section>
  );
}
