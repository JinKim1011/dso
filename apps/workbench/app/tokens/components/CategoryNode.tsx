import { ReactNode } from "react";

type CategoryGroup = {
  id: string;
  category: string;
};

type CategoryNodeProps = {
  category: CategoryGroup;
  children?: ReactNode;
};

export function CategoryNode({ category, children }: CategoryNodeProps) {
  return (
    <section data-testid={category.id}>
      <h2>{category.category}</h2>
      {children}
    </section>
  );
}
