import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { TokensView } from "./TokensView";

describe("TokensView smoke render test", () => {
  it("renders a section element", () => {
    const { container } = render(createElement(TokensView));
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
  });

  it("renders a h1 in section", () => {
    const { container } = render(createElement(TokensView));
    const section = container.querySelector("section");
    const h1 = section?.querySelector("h1");

    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe("hello");
  });
});
