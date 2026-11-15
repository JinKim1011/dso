"use client";

import { Button, Input, InputBase, Text } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
      router.replace("/tokens/color");
      router.refresh();
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const overrideButtonBGClass =
    "bg-surface-accent hover:bg-surface-accent active:bg-surface-accent";
  const overrideButtonTextClass =
    "text-content-accentStrong hover:text-content-accent active:text-content-accent";

  return (
    <main className="px-mini flex min-h-dvh w-full items-center justify-center">
      <form
        className="gap-regularPlus flex w-full max-w-60 flex-col"
        onSubmit={handleSubmit}
      >
        <Text
          as="h1"
          variant="heading-md"
          className="text-content-primary w-full text-center"
        >
          Log in to DSO
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
          label={pending ? "Logging in..." : "Log in"}
          overrideBgClass={overrideButtonBGClass}
          overrideTextColorClass={overrideButtonTextClass}
          className="rounded-micro"
          disabled={pending}
          fullWidth
        />
      </form>
    </main>
  );
}
