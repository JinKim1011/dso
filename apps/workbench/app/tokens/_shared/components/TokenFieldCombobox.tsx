import { Combobox, Text } from "@repo/ui";

type TokenFieldComboboxProps = {
  id: string;
  label: string;
  value?: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
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
          options={options.map((option) => ({ value: option, label: option }))}
          placeholder={placeholder}
          onChange={(next) => {
            if (!next) return;
            onChange(next);
          }}
        />
      </div>
    </div>
  );
}
