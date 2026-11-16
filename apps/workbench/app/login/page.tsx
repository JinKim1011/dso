"use client";

import { Button, Input, InputBase, Text, Toaster } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("reason") !== "project-authentication-required") return;

    url.searchParams.delete("reason");
    window.history.replaceState(window.history.state, "", url);
    Toaster.toast.warning("Log in to access the project.", {
      id: "project-authentication-required",
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) return;

    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? "Invalid email or password."
            : "Unable to log in. Please try again.",
        );
        return;
      }

      setPassword("");
      router.replace("/projects");
      router.refresh();
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="px-mini bg-dot-pattern flex min-h-dvh w-full items-center justify-center">
      <Toaster />
      <form
        className="gap-regularPlus flex w-full max-w-60 flex-col"
        onSubmit={handleSubmit}
      >
        <Text
          as="h1"
          variant="heading-md"
          className="text-content-primary w-full text-center"
        >
          log in to DSO
        </Text>
        <div className="gap-mini flex flex-col">
          <Input
            id="login-email"
            name="email"
            placeholder="Email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <InputBase
            id="login-password"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <Text role="alert" variant="input-helper-sm" className="text-content-error">
              {error}
            </Text>
          )}
        </div>
        <Button
          type="submit"
          label={pending ? "LOGGING IN..." : "LOG IN"}
          className="rounded-micro"
          disabled={pending}
          fullWidth
        />
      </form>
    </main>
  );
}
