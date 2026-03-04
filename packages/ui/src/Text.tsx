import React from "react";
import { TypographyVariant, typographyStyles } from "./types/typography";

type TextProps<T extends React.ElementType = "p"> = {
  variant?: TypographyVariant;
  as?: T;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export const Text = <T extends React.ElementType = "p">({
  variant = "body-md",
  as,
  children,
  className = "",
  ...props
}: TextProps<T>) => {
  const Component = as || "p";
  const baseStyles = typographyStyles[variant];
  const combinedClasss = `${baseStyles}${className}`.trim();

  return (
    <Component className={combinedClasss} {...props}>
      {children}
    </Component>
  );
};
