"use client";

import dynamic from "next/dynamic";

/**
 * `next/dynamic` with `ssr: false` must run inside a Client Component. If it
 * lives in a Server Component, Next can ignore `ssr: false`, SSR Konva, and
 * the UI stays on “Loading editor…” forever.
 */
const EditorShell = dynamic(() => import("@/components/editor/EditorShell"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">Loading editor…</div>
  ),
});

export function EditorLoadClient() {
  return <EditorShell />;
}
