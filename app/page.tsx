import { EditorHost } from "@/components/editor/EditorHost";

export default function Home() {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border/80 bg-card px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-serif text-lg font-medium tracking-tight text-foreground sm:text-xl">Scrapbook</h1>
          <p className="text-xs text-muted-foreground">Family design editor</p>
        </div>
      </header>
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <EditorHost />
        </section>
      </div>
    </div>
  );
}
