"use client";

import { create } from "zustand";
import type { EditorElement, HistorySnapshot, ImageElement, PageModel, TextElement, PersistedEditor, ImageCrop } from "@/types/editor";
import { PAGE_H, PAGE_W } from "@/types/editor";
import { newId } from "@/lib/ids";
import {
  createDefaultPersistedState,
  createWelcomeText,
  getSafeCurrentPage,
  normalizePersistedEditor,
} from "@/lib/mockPersistence";
import { THEME_INK, THEME_TEXT_SERIF } from "@/lib/textFonts";

const MAX_HISTORY = 50;
const MIN_SIZE = 20;

type EditorState = PersistedEditor & {
  history: HistorySnapshot[];
  future: HistorySnapshot[];
  /** View zoom around page — not persisted / not in history */
  zoom: number;
  /** For text modal edit; id of text being edited, or null */
  textEditId: string | null;
};

function cloneElement(el: EditorElement): EditorElement {
  return structuredClone(el);
}

function doSnapshot(
  s: Pick<EditorState, "pages" | "elements" | "currentPageId" | "selectedElementId">
): HistorySnapshot {
  return {
    pages: s.pages.map((p) => ({ ...p, elementOrder: [...p.elementOrder] })),
    elements: Object.fromEntries(
      Object.entries(s.elements).map(([k, v]) => [k, cloneElement(v)])
    ) as HistorySnapshot["elements"],
    currentPageId: s.currentPageId,
    selectedElementId: s.selectedElementId,
  };
}

/** Working copy: only document fields — `fn` mutates this, then it merges into Zustand state. */
type Doc = Pick<EditorState, "pages" | "elements" | "currentPageId" | "selectedElementId">;

function cloneDoc(s: Doc): Doc {
  return {
    pages: s.pages.map((p) => ({ ...p, elementOrder: [...p.elementOrder] })),
    elements: Object.fromEntries(
      Object.entries(s.elements).map(([k, v]) => [k, cloneElement(v)])
    ) as Doc["elements"],
    currentPageId: s.currentPageId,
    selectedElementId: s.selectedElementId,
  };
}

const defaultCrop: ImageCrop = { x: 0, y: 0, width: 1, height: 1, scale: 1 };


const initial: EditorState = (() => {
  const p = createDefaultPersistedState();
  const pe = p.pages[0]!;
  const t = createWelcomeText(pe.id);
  return {
    ...p,
    elements: { [t.id]: t },
    selectedElementId: t.id,
    currentPageId: pe.id,
    pages: p.pages.map((x) => (x.id === pe.id ? { ...x, elementOrder: [t.id] } : x)),
    history: [] as HistorySnapshot[],
    future: [] as HistorySnapshot[],
    zoom: 1,
    textEditId: null,
  };
})();

type Store = EditorState & {
  /** Internal: run mutation with history. */
  _withHistory: (fn: (d: Doc) => void) => void;
  setZoom: (z: number) => void;
  setSelected: (id: string | null) => void;
  setTextEditId: (id: string | null) => void;
  addText: () => void;
  addImageFromDataUrl: (src: string) => void;
  updateElement: (id: string, partial: Partial<EditorElement> | ((el: EditorElement) => EditorElement)) => void;
  /** Replace transform on element after Konva (full replace for type safety). */
  setElementFrame: (id: string, frame: Pick<EditorElement, "x" | "y" | "width" | "height" | "rotation">) => void;
  deleteSelected: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  undo: () => void;
  redo: () => void;
  /** Hydrate from mock persistence; optional merge with current */
  loadPersisted: (p: PersistedEditor) => void;
  getExportPayload: () => PersistedEditor;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /**
   * Snapshot once before a property-slider gesture; `setElementFieldLive` updates
   * without new undo frames. `endPropertyGesture` appends the snapshot to history
   * so undo reverts the whole drag.
   */
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  /** In-place update for sliders / live drags (no new history line). */
  setElementFieldLive: (id: string, update: (el: EditorElement) => EditorElement) => void;
};

/**
 * State before a slider gesture for one undo that restores the pre-gesture document.
 * Lives outside the store to avoid rehydration.
 */
let prePropertyGesture: HistorySnapshot | null = null;

export const useEditorStore = create<Store>()((set, get) => ({
    ...initial,
    _withHistory: (fn) => {
      set((s) => {
        const snap = doSnapshot(s);
        const d = cloneDoc(s);
        fn(d);
        return {
          ...s,
          ...d,
          history: [...s.history, snap].slice(-MAX_HISTORY),
          future: [],
        };
      });
    },
    setZoom: (z) => {
      set({ zoom: Math.min(2, Math.max(0.4, z)) });
    },
    setSelected: (id) => set({ selectedElementId: id, textEditId: null }),
    setTextEditId: (id) => set({ textEditId: id }),
    addText: () => {
      get()._withHistory((d) => {
        const page = getSafeCurrentPage(d.pages, d.currentPageId);
        const id = newId();
        const el: TextElement = {
          id,
          type: "text",
          pageId: page.id,
          x: 120,
          y: 180,
          width: 500,
          height: 100,
          rotation: 0,
          text: "New text",
          style: {
            fontSize: 32,
            fill: THEME_INK,
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            fontFamily: THEME_TEXT_SERIF,
          },
        };
        d.elements[id] = el;
        d.selectedElementId = id;
        const pIdx = d.pages.findIndex((p) => p.id === page.id);
        if (pIdx >= 0) {
          d.pages[pIdx] = {
            ...d.pages[pIdx]!,
            elementOrder: [...d.pages[pIdx]!.elementOrder, id],
          };
        }
      });
    },
    addImageFromDataUrl: (src) => {
      if (typeof window === "undefined") return;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        get()._withHistory((d) => {
          const page = getSafeCurrentPage(d.pages, d.currentPageId);
          const id = newId();
          const w = 320;
          const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
          const h = w / aspect;
          const el: ImageElement = {
            id,
            type: "image",
            pageId: page.id,
            x: (PAGE_W - w) / 2,
            y: (PAGE_H - h) / 2,
            width: w,
            height: h,
            rotation: 0,
            src,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            crop: { ...defaultCrop },
            flipHorizontal: false,
          };
          d.elements[id] = el;
          d.selectedElementId = id;
          const pIdx = d.pages.findIndex((p) => p.id === page.id);
          if (pIdx >= 0) {
            d.pages[pIdx] = {
              ...d.pages[pIdx]!,
              elementOrder: [...d.pages[pIdx]!.elementOrder, id],
            };
          }
        });
      };
      img.src = src;
    },
    updateElement: (id, partial) => {
      get()._withHistory((d) => {
        const ex = d.elements[id];
        if (!ex) return;
        d.elements[id] = typeof partial === "function" ? partial(ex) : { ...ex, ...partial } as EditorElement;
      });
    },
    setElementFrame: (id, frame) => {
      get()._withHistory((d) => {
        const ex = d.elements[id];
        if (!ex) return;
        d.elements[id] = {
          ...ex,
          x: frame.x,
          y: frame.y,
          width: Math.max(MIN_SIZE, frame.width),
          height: Math.max(MIN_SIZE, frame.height),
          rotation: frame.rotation,
        } as EditorElement;
      });
    },
    deleteSelected: () => {
      const { selectedElementId } = get();
      if (!selectedElementId) return;
      get()._withHistory((d) => {
        const id = d.selectedElementId;
        if (!id || !d.elements[id]) return;
        delete d.elements[id];
        d.selectedElementId = null;
        d.pages = d.pages.map((p) => ({
          ...p,
          elementOrder: p.elementOrder.filter((e) => e !== id),
        }));
      });
    },
    bringForward: (id) => {
      get()._withHistory((d) => {
        const pIdx = d.pages.findIndex((p) => p.id === d.currentPageId);
        if (pIdx < 0) return;
        const ord = [...d.pages[pIdx]!.elementOrder];
        const i = ord.indexOf(id);
        if (i < 0 || i === ord.length - 1) return;
        [ord[i], ord[i + 1]] = [ord[i + 1]!, ord[i]!];
        d.pages[pIdx] = { ...d.pages[pIdx]!, elementOrder: ord };
      });
    },
    sendBackward: (id) => {
      get()._withHistory((d) => {
        const pIdx = d.pages.findIndex((p) => p.id === d.currentPageId);
        if (pIdx < 0) return;
        const ord = [...d.pages[pIdx]!.elementOrder];
        const i = ord.indexOf(id);
        if (i <= 0) return;
        [ord[i], ord[i - 1]] = [ord[i - 1]!, ord[i]!];
        d.pages[pIdx] = { ...d.pages[pIdx]!, elementOrder: ord };
      });
    },
    undo: () => {
      set((s) => {
        if (s.history.length === 0) return s;
        const last = s.history[s.history.length - 1]!;
        const toFuture: HistorySnapshot = doSnapshot(s);
        return {
          ...s,
          ...last,
          history: s.history.slice(0, -1),
          future: [toFuture, ...s.future].slice(0, MAX_HISTORY),
        };
      });
    },
    redo: () => {
      set((s) => {
        if (s.future.length === 0) return s;
        const next = s.future[0]!;
        const toHistory = doSnapshot(s);
        return {
          ...s,
          ...next,
          future: s.future.slice(1),
          history: [...s.history, toHistory].slice(-MAX_HISTORY),
        };
      });
    },
    loadPersisted: (p) => {
      const doc = normalizePersistedEditor(p);
      set((s) => ({
        ...s,
        ...doc,
        textEditId: null,
        history: [],
        future: [],
      }));
    },
    getExportPayload: () => {
      const { pages, elements, currentPageId, selectedElementId } = get();
      return { pages, elements, currentPageId, selectedElementId };
    },
    canUndo: () => get().history.length > 0,
    canRedo: () => get().future.length > 0,
    startPropertyGesture: () => {
      if (prePropertyGesture != null) return;
      prePropertyGesture = doSnapshot(get());
    },
    endPropertyGesture: () => {
      if (prePropertyGesture == null) return;
      const snap = prePropertyGesture;
      prePropertyGesture = null;
      set((s) => ({
        ...s,
        history: [...s.history, snap].slice(-MAX_HISTORY),
        future: [],
      }));
    },
    setElementFieldLive: (id, update) => {
      set((s) => {
        const ex = s.elements[id];
        if (!ex) return s;
        return { elements: { ...s.elements, [id]: update(ex) } };
      });
    },
}));

export function selectElementsForPage(page: PageModel, elements: Record<string, EditorElement>) {
  return page.elementOrder.map((id) => elements[id]).filter(Boolean);
}
