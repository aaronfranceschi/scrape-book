"use client";

import { useEffect } from "react";

/**
 * Catches client errors in the app route segment. Full reload after a code change
 * is often required if the dev server had a stale Webpack chunk (e.g. missing ./682.js).
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Reload page
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        If you just edited code, run <code className="rounded bg-muted px-1 py-0.5">npm run clean</code> then{" "}
        <code className="rounded bg-muted px-1 py-0.5">npm run dev</code> to clear a broken build cache.
      </p>
    </div>
  );
}
