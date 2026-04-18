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
        "aria-pressed": selectedToken === "TokenA",
        className: "tokenA",
        onClick: () => {
          setSelectedToken("TokenA");
        },
      },
      `${selectedToken === "TokenA" ? "selected: TokenA" : "TokenA"}`,
    ),

    createElement(
      "button",

      {
        "aria-pressed": selectedToken === "TokenB",
        className: "tokenB",
        onClick: () => {
          setSelectedToken("TokenB");
        },
      },
      `${selectedToken === "TokenB" ? "selected: TokenB" : "TokenB"}`,
    ),
  );
}
