# Family Scrapbook - Design Editor

A browser-based, parent-friendly page editor for family scrapbook layouts. Think **Canva** or **PowerPoint**–style: one printable page, images and text, drag, resize, rotate, undo/redo, and **PNG** export. State is a **JSON-serializable** document that maps cleanly to **MongoDB** later; **persistence** is currently mocked (browser `localStorage`).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

Deploy on **Vercel** with the default settings (no extra config required). The **Konva** canvas runs only on the client: `EditorShell` is loaded with `next/dynamic` and `ssr: false` so `window` / `canvas` are not touched during SSR.

## Stack

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**
- **shadcn/ui**-style primitives (Radix + `class-variance-authority` + `tailwind-merge`)
- **react-konva** / **Konva** (stage is client-only; webpack **aliases the Node `canvas` package** in `next.config.mjs` so the build stays Node-free)
- **Zustand** for editor state: normalized `pages[]` + `elements` map, `selectedElementId`, `history` / `future` for **undo** / **redo**
- **Mock** save/load: `lib/mockPersistence.ts` (swap for `fetch` to your API)

## Project layout (editor)

| Path | Role |
|------|------|
| `components/editor/EditorShell.tsx` | Layout, zoom wrapper, text dialog, keyboard shortcuts |
| `components/editor/CanvasStage.tsx` | Page, background, `Transformer`, layer ref for export |
| `components/editor/Toolbar.tsx` | Top + left toolbars (add text/image, undo, zoom, export, mock save) |
| `components/editor/PropertiesPanel.tsx` | Frame + text/image controls |
| `components/editor/elements/TextElement.tsx` | Text node (center-anchored `Group` for transform) |
| `components/editor/elements/ImageElement.tsx` | Image, normalized crop, flip, `use-image` |
| `store/editorStore.ts` | One undo step per `_withHistory` action |
| `types/editor.ts` | Serializable element & page types |
| `lib/exportCanvas.ts` | PNG helper + **PDF** / **HTML** placeholders |
| `lib/editorLayout.ts` | Stage size, page offset on workspace |

## Features (MVP)

- **Us Letter–style** page (816×1056 px) on a gray **workspace**; view **zoom** (separate from history, not stored in undo).
- **Text**: font size, color, bold/italic; double-click or “Edit” opens a modal. Position, size, rotation in the right panel.
- **Images**: upload, sample gradient, **non-destructive** crop (normalized 0–1 + `scale`), horizontal flip, same transforms as text.
- **Selection**: transformer with rotate + resize; obvious stroke when selected.
- **Undo / redo** (add, delete, move, resize, rotate, style) up to 50 steps.
- **Export**: current page to **PNG** (data URL download) or **PDF** (jsPDF embeds the same page PNG at letter size, `lib/exportCanvas.ts`). **HTML** export remains a small placeholder for a static layout renderer.
- **Mock save** / **load** writes the same JSON shape to `localStorage` under the key in `lib/mockPersistence.ts`.

## Future backend (MongoDB)

- Store one document (or a collection) mirroring `PersistedEditor` in `types/editor.ts` plus `userId`, `title`, `updatedAt`.
- `elements[ id ]` can stay a map for O(1) access; or split into a sub-collection if documents grow.
- For large images, **replace** data URLs in `image.src` with object storage **URLs**; keep the same `crop` / `originalWidth` / `originalHeight` in the document.
- Keep **export** on the client, or add a **server** route (e.g. `sharp` or headless) for print pipelines.

## Keyboard

- **Delete** — remove selected (when not typing in a field)
- **Ctrl+Z** / **Ctrl+Y** (or **Cmd** on Mac) — undo / redo
- **Escape** — close text editor dialog

## Embedding in a dashboard

Import the client module only in a client or dynamic context:

```tsx
import dynamic from "next/dynamic";
const EditorShell = dynamic(
  () => import("@/components/editor/EditorShell").then((m) => ({ default: m.EditorShell })),
  { ssr: false }
);
```

Then render `<EditorShell />` inside your layout. The app’s home page (`app/page.tsx`) is an example: header + **card** wrapping the editor.
