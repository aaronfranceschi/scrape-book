import type { PersistedEditor } from "@/types/editor";
import { PAGE_H, PAGE_W, type PageModel, type TextElement, type TextStyle } from "@/types/editor";
import { newId } from "./ids";

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
  fill: "#1e293b",
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  fontFamily: "Inter, system-ui, sans-serif",
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
    text: "Add photos and a story. Double-click to edit this text.",
    style: { ...defaultTextStyle, fontSize: 28 },
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

/** Backfill new text fields so older saved JSON stays valid. */
export function normalizePersistedEditor(p: PersistedEditor): PersistedEditor {
  const elements = { ...p.elements };
  for (const id of Object.keys(elements)) {
    const e = elements[id]!;
    if (e.type === "text" && e.style.textDecoration == null) {
      elements[id] = { ...e, style: { ...e.style, textDecoration: "none" } };
    }
  }
  return { ...p, elements };
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
