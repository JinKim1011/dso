import { ChevronDownIcon } from "@radix-ui/react-icons";
import { KeyboardEventHandler, useState } from "react";
import { InputBase } from "../input/InputBase";
import { Listbox } from "./Listbox";

type ComboboxItem = {
  value: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
};

type ComboboxProps = {
  options: ComboboxItem[];
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
  const inputValue = selectedOption ? selectedOption.label : placeholder;

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

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };
  const handleClick = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };
  const handleBlur = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" onBlur={handleBlur} tabIndex={-1}>
      <InputBase
        readOnly
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        rightIcon={ChevronDownIcon}
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
