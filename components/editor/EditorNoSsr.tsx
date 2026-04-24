"use client";

import dynamic from "next/dynamic";
import { Component, type ErrorInfo, type ReactNode } from "react";

const ClientEditor = dynamic(() => import("./EditorShell"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-background text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

function EditorErrorBoundary({ children }: { children: ReactNode }) {
  return <EditorErrorBoundaryInner>{children}</EditorErrorBoundaryInner>;
}

class EditorErrorBoundaryInner extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Editor render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-sm font-medium text-destructive">The editor hit an error</p>
          <p className="max-w-md text-xs text-muted-foreground">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Client-only editor (Konva). `next/dynamic` with `ssr: false` keeps the
 * Konva/canvas tree off the server; the error boundary surfaces render failures.
 */
export function EditorNoSsr() {
  return (
    <EditorErrorBoundary>
      <ClientEditor />
    </EditorErrorBoundary>
  );
}
