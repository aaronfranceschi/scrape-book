import type { EditorElement, PersistedEditor } from "@/types/editor";
import { PAGE_H, PAGE_W, type PageModel, type TextElement, type TextStyle } from "@/types/editor";
import { newId } from "./ids";
import { THEME_INK, THEME_TEXT_SERIF } from "./textFonts";

const KEY = "scrapbook-editor-mock";

function makeDefaultPage(): PageModel {
  return {
    id: newId(),
    name: "Page 1",
    width: PAGE_W,
    height: PAGE_H,
    elementOrder: [],
  };
}

const defaultTextStyle: TextStyle = {
  fontSize: 32,
  fill: THEME_INK,
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  fontFamily: THEME_TEXT_SERIF,
};

/** Empty editor document — one blank page, no elements. */
export function createDefaultPersistedState(): PersistedEditor {
  const p = makeDefaultPage();
  return {
    pages: [p],
    currentPageId: p.id,
    elements: {},
    selectedElementId: null,
  };
}

/** For demo: optional welcome text when nothing else present (added client-side only in UI if desired). */
export function createWelcomeText(
  pageId: string
): TextElement {
  return {
    id: newId(),
    type: "text",
    pageId,
    x: 80,
    y: 80,
    width: 640,
    height: 64,
    rotation: 0,
    text: "Your story starts here, photos, type, a little mess. Double-click to edit.",
    style: { ...defaultTextStyle, fontSize: 24 },
  };
}

/**
 * Mock "save" — in production, POST JSON to your API; here we `localStorage`.
 * @returns `false` if storage failed (quota, private mode) or is unavailable
 */
export function saveEditorMock(persisted: PersistedEditor): boolean {
  if (typeof window === "undefined") return false;
  const json = JSON.stringify(persisted);
  try {
    window.localStorage.setItem(KEY, json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves a valid current page, even if data was corrupted (empty `pages` or
 * invalid `currentPageId`).
 */
export function getSafeCurrentPage(pages: PageModel[], currentPageId: string): PageModel {
  if (!Array.isArray(pages) || pages.length === 0) {
    return makeDefaultPage();
  }
  return pages.find((p) => p.id === currentPageId) ?? pages[0]!;
}

/** Backfill new text fields, repair bad saves, and keep document shape load-safe. */
export function normalizePersistedEditor(p: PersistedEditor): PersistedEditor {
  const fallback = createDefaultPersistedState();
  let pages: PageModel[] = Array.isArray(p.pages) && p.pages.length > 0
    ? p.pages.map((page) => ({
        ...page,
        id: page.id ?? newId(),
        name: page.name || "Page",
        width: Number.isFinite(page.width) && page.width > 0 ? page.width : PAGE_W,
        height: Number.isFinite(page.height) && page.height > 0 ? page.height : PAGE_H,
        elementOrder: Array.isArray(page.elementOrder) ? page.elementOrder : [],
      }))
    : [...fallback.pages];
  const pageIds = new Set(pages.map((x) => x.id));

  const elements: Record<string, EditorElement> = { ...p.elements };
  for (const id of Object.keys(elements)) {
    const e = elements[id]!;
    if (e.type === "text" && e.style.textDecoration == null) {
      elements[id] = { ...e, style: { ...e.style, textDecoration: "none" } };
    }
    if (!pageIds.has(e.pageId)) {
      const fp = pages[0]!.id;
      elements[id] = { ...e, pageId: fp } as EditorElement;
    }
  }

  let currentPageId = typeof p.currentPageId === "string" ? p.currentPageId : pages[0]!.id;
  if (!pageIds.has(currentPageId)) {
    currentPageId = pages[0]!.id;
  }

  pages = pages.map((page) => {
    const order: string[] = page.elementOrder.filter((id) => {
      const el = elements[id];
      return el != null && el.pageId === page.id;
    });
    const inOrder = new Set(order);
    for (const id of Object.keys(elements)) {
      const el = elements[id]!;
      if (el.pageId === page.id && !inOrder.has(id)) {
        order.push(id);
        inOrder.add(id);
      }
    }
    return { ...page, elementOrder: order };
  });

  let selectedElementId: string | null = p.selectedElementId ?? null;
  if (selectedElementId != null && elements[selectedElementId] == null) {
    selectedElementId = null;
  }

  return { pages, currentPageId, elements, selectedElementId };
}

/**
 * Mock "load" from localStorage; returns `null` if nothing stored.
 */
export function loadEditorMock(): PersistedEditor | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return normalizePersistedEditor(JSON.parse(raw) as PersistedEditor);
  } catch {
    return null;
  }
}
