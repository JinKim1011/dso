"use client";

import { createElement, useState } from "react";

export function TokensView() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  return createElement(
    "section",
    null,
    createElement("h1", null, "hello"),
    createElement(
      "button",
      {
        "aria-pressed": selectedToken === "Token A",
        onClick: () => {
          setSelectedToken("Token A");
        },
      },
      "Token A",
    ),

    createElement(
      "button",

      {
        "aria-pressed": selectedToken === "Token B",
        onClick: () => {
          setSelectedToken("Token B");
        },
      },
      "Token B",
    ),
  );
}
