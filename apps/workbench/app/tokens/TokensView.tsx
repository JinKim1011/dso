"use client";

import { createElement, useState } from "react";

export function TokensView() {
  const [pressed, setPressed] = useState(false);

  return createElement(
    "section",
    null,
    createElement("h1", null, "hello"),
    createElement(
      "button",

      {
        "aria-pressed": pressed,
        onClick: () => {
          setPressed((current) => !current);
        },
      },
      "Token A",
    ),
  );
}
