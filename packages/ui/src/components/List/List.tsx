"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { createMotionTransition } from "../../types/motion";
import { ListItem, type ListItemProps } from "./ListItem";

export interface ListProps extends Omit<HTMLMotionProps<"ul">, "className"> {
  listItems: ListItemProps[];
}

const listTransition = createMotionTransition("quick", "outExpo");

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { ...listTransition, staggerChildren: 0.02 },
  },
};

export const List = ({ listItems, ...props }: ListProps) => {
  return (
    <motion.ul
      {...props}
      variants={listVariants}
      initial="hidden"
      role="listbox"
      animate="visible"
      className="px-miniPlus gap-microPlus flex flex-col"
    >
      {listItems.map((item) => (
        <ListItem key={item.id} {...item} />
      ))}
    </motion.ul>
  );
};
