import React from "react";
import { TypographyVariant, typographyStyles } from "./types/typography";

interface TextProps {
  variant?: TypographyVariant;
  as?: TextElement;
  children: React.ReactNode;
  className?: String;
}

type TextElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "label";

export const Text = ({
  variant = "body-md",
  as: Component = "p",
  children,
  className = "",
  ...props
}: TextProps) => {
  const baseStyles = typographyStyles[variant];
  const combinedClasss = `${baseStyles}${className}`.trim();

  return (
    <Component className={combinedClasss} {...props}>
      {children}
    </Component>
  );
};
