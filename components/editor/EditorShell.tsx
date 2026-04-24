"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { CanvasStage } from "./CanvasStage";
import { EditorToolbar } from "./Toolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { downloadHtml } from "@/lib/exportHtml";

type ExportApi = { getPng: () => string; getLayer: () => unknown } | null;

const ZOOM_WHEEL_STEP = 0.0018;

/**
 * Top toolbar, scrollable work area, text edit dialog, keyboard shortcuts.
 */
export function EditorShell() {
  const exportRef = useRef<ExportApi>(null);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const [portW, setPortW] = useState(1200);
  const zoom = useEditorStore((s) => s.zoom);
  const setTextEditId = useEditorStore((s) => s.setTextEditId);
  const textEditId = useEditorStore((s) => s.textEditId);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const elements = useEditorStore((s) => s.elements);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const pages = useEditorStore((s) => s.pages);
  const currentPageId = useEditorStore((s) => s.currentPageId);

  const onLayerReady = useCallback((api: NonNullable<ExportApi>) => {
    exportRef.current = api;
  }, []);

  useLayoutEffect(() => {
    const el = canvasScrollRef.current;
    if (!el) return;
    const apply = () => {
      setPortW(Math.max(0, el.getBoundingClientRect().width));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey || e.altKey)) return;
      e.preventDefault();
      e.stopPropagation();
      const prev = useEditorStore.getState().zoom;
      const next = Math.min(2, Math.max(0.4, prev * (1 - e.deltaY * ZOOM_WHEEL_STEP)));
      useEditorStore.getState().setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  const onExportPng = useCallback(() => {
    const data = exportRef.current?.getPng?.();
    if (!data || typeof document === "undefined") return;
    const a = document.createElement("a");
    a.href = data;
    a.download = "scrapbook-page.png";
    a.click();
  }, []);

  const onExportPdf = useCallback(() => {
    const data = exportRef.current?.getPng?.();
    if (!data) return;
    void import("@/lib/exportCanvas").then((m) => m.downloadPngDataUrlAsPdf(data, "scrapbook-page.pdf"));
  }, []);

  const onExportHtml = useCallback(() => {
    const p = pages.find((x) => x.id === currentPageId) ?? pages[0];
    if (!p) return;
    downloadHtml("scrapbook-page.html", p, elements);
  }, [pages, currentPageId, elements]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t.isContentEditable) {
        if (e.key === "Escape" && textEditId) {
          e.preventDefault();
          setTextEditId(null);
        }
        return;
      }
      if (e.key === "Delete") {
        e.preventDefault();
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected, undo, redo, setTextEditId, textEditId]);

  return (
    <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-muted/15 to-muted/5">
      <div className="shrink-0 space-y-1.5 border-b border-border/60 bg-card/90 p-2.5 shadow-sm backdrop-blur sm:px-3 sm:py-3">
        <EditorToolbar onExportPng={onExportPng} onExportPdf={onExportPdf} onExportHtml={onExportHtml} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 p-2 md:gap-3 md:p-3.5">
        <div
          ref={canvasScrollRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-contain rounded-xl border border-border/40 bg-gradient-to-b from-slate-200/35 to-slate-200/25 p-2.5 sm:p-4"
        >
          <div className="inline-flex w-max min-h-full min-w-full max-w-none flex-col items-center justify-center">
            <CanvasStage containerWidth={portW} zoom={zoom} onLayerReady={onLayerReady} />
          </div>
        </div>
        <aside className="hidden w-[min(100%,18rem)] shrink-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card/85 p-2.5 shadow-sm ring-1 ring-black/[0.04] md:block md:min-w-[16rem] md:max-w-[20rem] md:p-3.5">
          <div className="h-full min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
            <PropertiesPanel className="max-w-none border-0 bg-transparent shadow-none ring-0" />
          </div>
        </aside>
      </div>

    </div>
  );
}

export default EditorShell;
