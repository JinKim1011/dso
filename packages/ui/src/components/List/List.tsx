"use client";

import { motion } from "framer-motion";
import { HTMLAttributes, useCallback, useEffect, useRef, useState } from "react";
import { createMotionTransition } from "../../types/motion";
import { ListItem, type ListItemProps } from "./ListItem";

export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement>, "className"> {
  listItems: ListItemProps[];
}

export const List = ({ listItems, ...props }: ListProps) => {
  const ulRef = useRef<HTMLUListElement | null>(null);
  const [dotY, setDotY] = useState<number | null>(null);

  const dotClass = [
    "w-[0.25rem] h-[0.25rem] absolute -left-3.5",
    "bg-surface-accentStrong",
  ].join(" ");

  const updateDot = useCallback(() => {
    const ul = ulRef.current;
    if (!ul) return setDotY(null);

    const selectedBtn = ul.querySelector<HTMLButtonElement>('[data-selected="true"]');

    if (!selectedBtn) {
      setDotY(null);
      return;
    }

    const ulRect = ul.getBoundingClientRect();
    const btnRect = selectedBtn.getBoundingClientRect();

    const centerY = btnRect.top - ulRect.top + btnRect.height / 2 - 2;
    setDotY(centerY);
  }, [listItems]);

  useEffect(() => {
    updateDot();
    window.addEventListener("resize", updateDot);

    let mo: MutationObserver | null = null;

    if (ulRef.current && typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(updateDot);
      mo.observe(ulRef.current, { attributes: true, childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener("resize", updateDot);
      mo?.disconnect();
    };
  }, [updateDot]);

  return (
    <ul {...props} ref={ulRef} className="relative flex h-full flex-col">
      <motion.li
        className={dotClass}
        initial={false}
        animate={dotY != null ? { y: dotY, opacity: 1 } : { opacity: 0 }}
        transition={createMotionTransition("regular", "inOutExpo")}
        style={{ top: 0 }}
        aria-hidden
        role="presentation"
      />
      {listItems.map((item) => (
        <ListItem key={item.id} {...item} />
      ))}
    </ul>
  );
};
