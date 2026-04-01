import type { ChangeEventHandler } from "react";
import { InputBase, type IconComponent } from "./InputBase";

type InputProps = {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  rightIcon?: IconComponent;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function Input({ value, placeholder, disabled, onChange, rightIcon }: InputProps) {
  return (
    <InputBase
      type="text"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
      rightIcon={rightIcon}
    />
  );
}
