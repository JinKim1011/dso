import { type IconComponent, ListboxOption } from "./ListboxOption";

export type ListboxItem = {
  value: string;
  label: string;
  helperText?: string;
  rightIcon?: IconComponent;
  disabled?: boolean;
};

type ListboxProps = {
  id?: string;
  options: ListboxItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

export function Listbox({ id, options, selectedValue, onSelect }: ListboxProps) {
  return (
    <div
      id={id}
      role="listbox"
      className="py-microPlus px-micro rounded-mini shadow-overlay-menu absolute flex w-full translate-y-[0.25rem] flex-col"
    >
      {options.map((option) => {
        const isDisabled = Boolean(option.disabled);
        const isSelected = option.value === selectedValue;
        const handleSelect = () => {
          if (isDisabled) return;
          onSelect(option.value);
        };

        return (
          <ListboxOption
            key={option.value}
            label={option.label}
            helperText={option.helperText}
            rightIcon={option.rightIcon}
            selected={isSelected}
            disabled={isDisabled}
            onSelect={handleSelect}
          ></ListboxOption>
        );
      })}
    </div>
  );
}
