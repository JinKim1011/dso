"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { type FocusEventHandler, type KeyboardEventHandler, useState } from "react";
import { InputBase } from "../input/InputBase";
import { Listbox, type ListboxItem } from "./Listbox";

type ComboboxProps = {
  id?: string;
  options: ListboxItem[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
};

export function Combobox({
  id,
  options,
  value,
  placeholder,
  disabled,
  onChange,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const inputValue = selectedOption ? selectedOption.label : "";

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    const nextFocusedElement = event.relatedTarget as Node | null;

    if (!event.currentTarget.contains(nextFocusedElement)) {
      setIsOpen(false);
    }
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };
  const handleClick = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const dropdownTransition = {
    duration: 0.25,
    ease: [0.19, 1, 0.22, 1] as const,
  };

  const dropdownVariants = {
    closed: {
      opacity: 0,
      y: -4,
      scale: 0.98,
      transition: dropdownTransition,
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: dropdownTransition,
    },
  };

  const listboxId = `${id}-listbox`;

  return (
    <div className="relative w-full" onBlur={handleBlur}>
      <InputBase
        readOnly
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        rightIcon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-control={isOpen ? listboxId : undefined}
      />
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="dropdown"
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute w-full"
            variants={dropdownVariants}
          >
            <Listbox
              id={id}
              options={options}
              selectedValue={value ?? ""}
              onSelect={handleSelect}
            ></Listbox>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
