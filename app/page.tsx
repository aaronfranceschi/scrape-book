import { EditorLoadClient } from "@/components/editor/EditorLoadClient";

/**
 * Single-viewport layout: `h-dvh` + `overflow-hidden` so the app fills the
 * window without a full-page scroll bar; the properties rail scrolls on its own.
 */
export default function Home() {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-gradient-to-b from-amber-50/40 via-background to-violet-50/35 text-foreground">
      <header className="shrink-0 border-b border-border/50 bg-card/90 px-4 py-3.5 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold tracking-tight text-foreground/95 sm:text-2xl">Family Scrapbook</h1>
        </div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl min-w-0 flex-1 flex-col gap-1.5 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-md ring-1 ring-black/[0.04] transition-shadow hover:shadow-lg">
          <EditorLoadClient />
        </section>
      </div>
    </div>
  );
}
