"use client";

type TokenValueDetailProps = {
  name: string;
  cssVar?: string;
  meta?: string;
};

export function TokenValueDetail({ name, cssVar, meta }: TokenValueDetailProps) {
  return (
    <div>
      <p>selected: {name}</p>
      <p>cssVar: {cssVar}</p>
      <p>meta: {meta}</p>
    </div>
  );
}
