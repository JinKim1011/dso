"use client";

type TokenValueDetailProps = {
  name: string;
  cssVar?: string;
  meta?: string;
  category: string;
  kind: string;
  value: TokenTypeValueItem;
};

export function TokenValueDetail({
  name,
  cssVar,
  meta,
  category,
  kind,
  value,
}: TokenValueDetailProps) {
  return (
    <div>
      <p>selected: {name}</p>
      {cssVar && <p>cssVar: {cssVar}</p>}
      {meta && <p>meta: {meta}</p>}
    </div>
  );
}
