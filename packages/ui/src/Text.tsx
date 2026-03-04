import type { ReactNode } from "react";
import { TypographyVariant, typographyStyles } from "./types/typography";

type TextProps<T extends React.ElementType = "p"> = {
  variant?: TypographyVariant;
<<<<<<< HEAD
  as?: T;
  children: React.ReactNode;
=======
  as?: TextElement;
  children: ReactNode;
>>>>>>> 79154d7 (fix(Text): use type-only import for ReactNode in TextProps)
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
  const combinedClassName = `${baseStyles} ${className}`.trim();

  return (
    <Component className={combinedClassName} {...props}>
      {children}
    </Component>
  );
};
