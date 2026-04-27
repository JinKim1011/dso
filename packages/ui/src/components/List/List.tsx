"use client";

import type { ComponentPropsWithoutRef } from "react";
import { ListItem, type ListItemProps } from "./ListItem";

export interface ListProps extends Omit<ComponentPropsWithoutRef<"ul">, "className"> {
  listItems: ListItemProps[];
}

export const List = ({ listItems, ...props }: ListProps) => {
  return (
    <ul {...props} className="px-miniPlus gap-microPlus flex flex-col">
      {listItems.map((item) => (
        <ListItem key={item.id} {...item} />
      ))}
    </ul>
  );
};
