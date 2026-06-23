"use client";

import { autoUpdate, flip, size, useFloating } from "@floating-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import {
  type FocusEventHandler,
  type KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  const referenceRef = useRef<HTMLDivElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const inputValue = selectedOption ? selectedOption.label : "";
  const [maxHeight, setMaxHeight] = useState(500);

  const { floatingStyles, refs } = useFloating({
    open: isOpen,
    strategy: "fixed",
    transform: false,
    placement: "bottom-start",
    middleware: [
      flip(),
      size({
        apply({ rects, availableHeight, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`;
          const calc = Math.min(500, availableHeight - 16);
          setMaxHeight(calc);
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target) return;

      if (referenceRef.current?.contains(target)) return;
      if (floatingRef.current?.contains(target)) return;

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);

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
    const floatingElement = floatingRef.current;

    if (
      !event.currentTarget.contains(nextFocusedElement) &&
      !floatingElement?.contains(nextFocusedElement)
    ) {
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
    <div
      ref={(node) => {
        referenceRef.current = node;
        refs.setReference(node);
      }}
      className="relative w-full"
      onBlur={handleBlur}
    >
      <InputBase
        id={id}
        readOnly
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        rightIcon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
      />
      {isOpen
        ? createPortal(
            <motion.div
              ref={(node) => {
                floatingRef.current = node;
                refs.setFloating(node);
              }}
              initial="closed"
              animate="open"
              style={{ ...floatingStyles, zIndex: 100 }}
              variants={dropdownVariants}
            >
              <Listbox
                id={listboxId}
                options={options}
                selectedValue={value ?? ""}
                onSelect={handleSelect}
                maxHeight={maxHeight}
              ></Listbox>
            </motion.div>,
            document.body,
          )
        : null}
    </div>
  );
}
