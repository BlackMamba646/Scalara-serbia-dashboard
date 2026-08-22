"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { ScalaraLogo } from "@/components/scalara-logo";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <ScalaraLogo className="h-12 w-12" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Scalara Radar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your password to continue
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <input
              name="password"
              type="password"
              required
              autoFocus
              placeholder="Password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-[10px] text-muted-foreground text-center">
          Scalara Labs &middot; iGaming Intelligence
        </p>
      </div>
    </div>
  );
}
