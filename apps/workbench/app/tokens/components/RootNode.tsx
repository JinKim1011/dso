import { ReactNode } from "react";

type RootNodeProps = {
  label: string;
  children: ReactNode;
};

export function RootNode({ label, children }: RootNodeProps) {
  return (
    <section>
      <h1> {label}</h1>
      {children}
    </section>
  );
}
