import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("TokensView integration tests", () => {
  it("selects TokenA when clicked", async () => {
    render(createElement(TokensView));
    const tokenA = screen.getByRole("button", { name: "TokenA" });

    expect(tokenA).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(tokenA);

    expect(tokenA).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("selected: TokenA")).toBeInTheDocument();
  });

  it("switches selection from TokenA to TokenB", async () => {
    render(createElement(TokensView));

    const tokenA = screen.getByRole("button", { name: "TokenA" });
    const tokenB = screen.getByRole("button", { name: "TokenB" });

    await userEvent.click(tokenA);

    expect(tokenA).toHaveAttribute("aria-pressed", "true");
    expect(tokenB).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("selected: TokenA")).toBeInTheDocument();

    await userEvent.click(tokenB);

    expect(tokenA).toHaveAttribute("aria-pressed", "false");
    expect(tokenB).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("selected: TokenB")).toBeInTheDocument();
  });
});
