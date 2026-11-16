import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function fillForm() {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("Email"), "user@example.test");
  await user.type(screen.getByPlaceholderText("Password"), "password");
  await user.click(screen.getByRole("button", { name: "LOG IN" }));
}

describe("login page", () => {
  it("submits credentials to the route and navigates after success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginPage />);

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password");
    await fillForm();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/projects"));
    expect(refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.test", password: "password" }),
    });
  });

  it("shows a generic credentials error without navigating", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    render(<LoginPage />);
    await fillForm();
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows network errors and permits retrying", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    render(<LoginPage />);
    await fillForm();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to log in. Please try again.");
    expect(screen.getByRole("button", { name: "LOG IN" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });
});
