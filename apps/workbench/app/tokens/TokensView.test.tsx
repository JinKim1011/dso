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

  it("selects Token A when clicked", async () => {
    render(createElement(TokensView));
    const tokenA = screen.getByRole("button", { name: "Token A" });

    expect(tokenA).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(tokenA);

    expect(tokenA).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("selected: Token A")).toBeInTheDocument();
  });

  it("switches selection from Token A to Token B", async () => {
    render(createElement(TokensView));

    const tokenA = screen.getByRole("button", { name: "Token A" });
    const tokenB = screen.getByRole("button", { name: "Token B" });

    await userEvent.click(tokenA);

    expect(tokenA).toHaveAttribute("aria-pressed", "true");
    expect(tokenB).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("selected: Token A")).toBeInTheDocument();

    await userEvent.click(tokenB);

    expect(tokenA).toHaveAttribute("aria-pressed", "false");
    expect(tokenB).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("selected: Token B")).toBeInTheDocument();
  });
});
