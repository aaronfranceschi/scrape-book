import Link from "next/link";

/**
 * Shown for any path that has no route (e.g. /foo). The app only has `/`.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-b from-violet-50/80 to-sky-50/60 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This app only has one screen: the editor at the home page. You may have opened a path that does not exist, or a bookmark to the wrong URL.
      </p>
      <Link
        href="/"
        className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
      >
        Open the scrapbook editor
      </Link>
    </div>
  );
}
