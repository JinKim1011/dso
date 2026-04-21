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
      {cssVar && <p>cssVar: {cssVar}</p>}
      {meta && <p>meta: {meta}</p>}
    </div>
  );
}
