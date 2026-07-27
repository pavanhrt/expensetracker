"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, type AuthFormState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-ink py-3 font-medium text-paper transition hover:bg-inkDark disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

const initialState: AuthFormState = { status: "idle" };

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction] = useActionState(authenticate, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ink">Vartā</h1>
          <p className="mt-1 text-sm text-muted">
            Speak or type your expenses in English or Telugu.
          </p>
        </div>

        <div className="flex rounded-full border border-black/10 bg-white p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full py-1.5 transition ${
              mode === "login" ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full py-1.5 transition ${
              mode === "signup" ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            Create account
          </button>
        </div>

        <form
          action={formAction}
          className="space-y-3 rounded-xl border border-black/10 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="mode" value={mode} />

          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-ink"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-muted" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 6 : undefined}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-ink"
            />
          </div>

          <SubmitButton label={mode === "signup" ? "Create account" : "Sign in"} />

          {state.message && (
            <p
              className={`text-center text-sm ${
                state.status === "error" ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {state.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
