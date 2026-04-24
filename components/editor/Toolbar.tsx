"use client";

import { useRef } from "react";
import { Type, Upload, Redo2, Undo2, Download, ZoomIn, FileType, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editorStore";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  className?: string;
};

/**
 * Add tools, zoom, undo/redo, and exports in one horizontal top bar.
 */
export function EditorToolbar({ onExportPng, onExportPdf, onExportHtml, className }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const addText = useEditorStore((s) => s.addText);
  const addImageFromDataUrl = useEditorStore((s) => s.addImageFromDataUrl);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === "string") addImageFromDataUrl(r.result);
    };
    r.readAsDataURL(f);
    e.target.value = "";
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="mr-1 flex min-w-0 flex-wrap items-center gap-1">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        <Button type="button" size="sm" variant="secondary" onClick={addText} className="gap-1 transition-colors hover:border-primary/30">
          <Type className="h-3.5 w-3.5" /> Add text
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()} className="gap-1 transition-colors hover:border-primary/30">
          <Upload className="h-3.5 w-3.5" /> Upload
        </Button>
      </div>
      <Separator orientation="vertical" className="h-7" />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="transition-colors"
        onClick={undo}
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="transition-colors"
        onClick={redo}
        disabled={!canRedo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <div className="flex min-w-[180px] max-w-[220px] shrink-0 grow items-center gap-2 px-1" title="Zoom the view (centered on the white page)">
        <ZoomIn className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Slider
          className="min-w-[100px] flex-1"
          value={[Math.round(zoom * 100)]}
          onValueChange={([v]) => {
            if (v == null) return;
            setZoom(v / 100);
          }}
          onValueCommit={([v]) => {
            if (v == null) return;
            setZoom(v / 100);
          }}
          min={40}
          max={200}
          step={1}
        />
        <span className="w-9 tabular-nums text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1">
        <Button type="button" size="sm" variant="secondary" onClick={onExportPng} className="gap-1 transition-colors hover:border-primary/30" title="Download page as PNG">
          <Download className="h-3.5 w-3.5" /> PNG
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onExportPdf} className="gap-1 transition-colors hover:border-primary/30" title="Export as PDF (wraps the page PNG)">
          <FileType className="h-3.5 w-3.5" /> PDF
        </Button>
        <Button type="button" size="sm" onClick={onExportHtml} className="gap-1 transition-colors" title="Download static HTML (current page)">
          <FileCode2 className="h-3.5 w-3.5" /> HTML
        </Button>
      </div>
    </div>
  );
}
