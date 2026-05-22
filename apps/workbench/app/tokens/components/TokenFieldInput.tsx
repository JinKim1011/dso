import { Input, Text } from "@repo/ui";

type TokenFieldInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function TokenFieldInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: TokenFieldInputProps) {
  return (
    <div className="gap-mini grid grid-cols-3">
      <div className="col-span-1 my-auto">
        <Text
          as="label"
          htmlFor={id}
          variant="input-label-sm"
          className="text-content-primary/35"
        >
          {label}
        </Text>
      </div>
      <div className="col-span-2">
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
