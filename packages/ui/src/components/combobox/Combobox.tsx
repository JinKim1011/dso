import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { type FocusEventHandler, type KeyboardEventHandler, useState } from "react";
import { InputBase } from "../input/InputBase";
import { Listbox, type ListboxItem } from "./Listbox";

type ComboboxProps = {
  options: ListboxItem[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
};

export function Combobox({
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

  const handleMouseDown: React.MouseEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault();
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };
  const handleClick = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative w-full" onBlur={handleBlur}>
      <InputBase
        readOnly
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        onMouseDown={handleMouseDown}
        rightIcon={isOpen ? ChevronUpIcon : ChevronDownIcon}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      />
      {isOpen ? (
        <div>
          <Listbox
            options={options}
            selectedValue={value ?? ""}
            onSelect={handleSelect}
          ></Listbox>
        </div>
      ) : null}
    </div>
  );
}
