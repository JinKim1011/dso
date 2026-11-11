import { Combobox, Text } from "@repo/ui";

type TokenFieldComboboxOption = string | { value: string; label: string };

type TokenFieldComboboxProps = {
  id: string;
  label: string;
  value?: string;
  options: TokenFieldComboboxOption[];
  placeholder?: string;
  onChange: (value: string | undefined) => void;
};

export function TokenFieldCombobox({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: TokenFieldComboboxProps) {
  return (
    <div className="gap-mini grid grid-cols-5">
      <div className="col-span-2">
        <Text
          as="label"
          htmlFor={id}
          variant="label-xs"
          className="text-content-primary/35 my-auto"
        >
          {label}
        </Text>
      </div>

      <div className="col-span-3">
        <Combobox
          id={id}
          value={value}
          options={options.map((option) =>
            typeof option === "string" ? { value: option, label: option } : option,
          )}
          placeholder={placeholder}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
