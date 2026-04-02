"use client";

import { InputBase, type InputBaseProps } from "./InputBase";

type InputProps = Omit<InputBaseProps, "type">;

export function Input(props: InputProps) {
  return <InputBase type="text" {...props} />;
}
