import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AccountMenu } from "./account-menu";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("sends the CSRF header when logging out", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(<AccountMenu email="user@example.test" />);

  await user.click(screen.getByRole("button", { name: "user@example.test" }));
  await user.click(screen.getByRole("menuitem", { name: "Log out" }));

  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
    method: "POST",
    headers: { "X-DSO-CSRF": "1" },
  });
  expect(refresh).toHaveBeenCalled();
});
