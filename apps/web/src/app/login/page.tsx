"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/lib/actions/auth";
import { ScalaraLogo } from "@/components/scalara-logo";

const googleErrors: Record<string, string> = {
  google_not_configured: "Google sign-in not configured. Use password.",
  auth_failed: "Google authentication failed. Try again.",
  access_denied: "Google access was denied.",
  no_code: "No authorization code received.",
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);
  const searchParams = useSearchParams();
  const googleError = searchParams.get("error");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <ScalaraLogo className="h-12 w-12" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Scalara Radar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to continue
            </p>
          </div>
        </div>

        {googleError && (
          <p className="text-sm text-destructive text-center">
            {googleErrors[googleError] || "Authentication error."}
          </p>
        )}

        <a
          href="/api/auth/google"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </a>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <input
              name="password"
              type="password"
              required
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
            {isPending ? "Signing in..." : "Sign in with password"}
          </button>
        </form>

        <p className="text-[10px] text-muted-foreground text-center">
          Scalara Labs &middot; iGaming Intelligence
        </p>
      </div>
    </div>
  );
}
