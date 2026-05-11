"use client";

import type { ComponentPropsWithoutRef } from "react";
import { CardItem, type CardItemProps } from "./CardItem";

export interface CardProps extends Omit<ComponentPropsWithoutRef<"ul">, "className"> {
  cardItems: CardItemProps[];
}

export const Card = ({ cardItems, ...props }: CardProps) => {
  return (
    <ul {...props} className="px-miniPlus gap-microPlus flex flex-col">
      {cardItems.map((item) => (
        <CardItem key={item.id} {...item} />
      ))}
    </ul>
  );
};