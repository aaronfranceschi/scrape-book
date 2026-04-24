"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditorStore } from "@/store/editorStore";
import type { EditorElement, ImageElement, TextElement } from "@/types/editor";
import { cn } from "@/lib/utils";
import { TEXT_FONT_OPTIONS } from "@/lib/textFonts";

function num(v: string) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Right rail. Radix `Slider` is **controlled** — you must use `onValueChange`
 * (and usually local state) so the thumb moves while dragging; we commit
 * to the store on `onValueCommit` where we want a single undo step.
 */
export function PropertiesPanel({ className }: { className?: string }) {
  const { elements, selectedElementId, updateElement, startPropertyGesture, endPropertyGesture, setElementFieldLive } = useEditorStore();
  const el = selectedElementId ? elements[selectedElementId] : null;

  const commitFrame = useCallback(
    (id: string, p: Partial<Pick<EditorElement, "x" | "y" | "width" | "height" | "rotation">>) => {
      updateElement(id, (e) => ({ ...e, ...p } as EditorElement));
    },
    [updateElement]
  );

  if (!el) {
    return (
      <div
        className={cn(
          "w-full max-w-[280px] rounded-lg border border-border/70 bg-card/95 p-4 text-sm text-muted-foreground shadow-sm ring-1 ring-black/[0.03] transition-shadow hover:shadow-md",
          className
        )}
      >
        <p>Select a text or image on the page to edit its properties.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-[280px] space-y-3 rounded-lg border border-border/70 bg-card/95 p-3.5 shadow-sm ring-1 ring-black/[0.03] transition-shadow hover:shadow-md hover:border-primary/20",
        className
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">Properties</h3>
        <p className="text-xs text-muted-foreground">{el.type === "text" ? "Text" : "Image"}</p>
      </div>
      <Separator />
      <FrameBlock
        el={el}
        commitFrame={commitFrame}
        startPropertyGesture={startPropertyGesture}
        endPropertyGesture={endPropertyGesture}
        setElementFieldLive={setElementFieldLive}
      />
      {el.type === "text" && (
        <TextBlock el={el} startPropertyGesture={startPropertyGesture} endPropertyGesture={endPropertyGesture} setElementFieldLive={setElementFieldLive} />
      )}
      {el.type === "image" && (
        <ImageBlock el={el} startPropertyGesture={startPropertyGesture} endPropertyGesture={endPropertyGesture} setElementFieldLive={setElementFieldLive} />
      )}
    </div>
  );
}

type CommitFrame = (id: string, p: Partial<Pick<EditorElement, "x" | "y" | "width" | "height" | "rotation">>) => void;

function FrameBlock({
  el,
  commitFrame,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: EditorElement;
  commitFrame: CommitFrame;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: (id: string, update: (e: EditorElement) => EditorElement) => void;
}) {
  const [rot, setRot] = useState(el.rotation);
  useEffect(() => {
    setRot(el.rotation);
  }, [el.id, el.rotation]);
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label className="text-xs">X</Label>
        <Input
          className="mt-0.5 h-8 transition-shadow hover:ring-1 hover:ring-ring/40"
          type="number"
          value={Math.round(el.x)}
          onChange={(e) => commitFrame(el.id, { x: num(e.target.value) })}
        />
      </div>
      <div>
        <Label className="text-xs">Y</Label>
        <Input
          className="mt-0.5 h-8 transition-shadow hover:ring-1 hover:ring-ring/40"
          type="number"
          value={Math.round(el.y)}
          onChange={(e) => commitFrame(el.id, { y: num(e.target.value) })}
        />
      </div>
      <div>
        <Label className="text-xs">W</Label>
        <Input
          className="mt-0.5 h-8 transition-shadow hover:ring-1 hover:ring-ring/40"
          type="number"
          value={Math.round(el.width)}
          onChange={(e) => commitFrame(el.id, { width: Math.max(20, num(e.target.value)) })}
        />
      </div>
      <div>
        <Label className="text-xs">H</Label>
        <Input
          className="mt-0.5 h-8 transition-shadow hover:ring-1 hover:ring-ring/40"
          type="number"
          value={Math.round(el.height)}
          onChange={(e) => commitFrame(el.id, { height: Math.max(20, num(e.target.value)) })}
        />
      </div>
      <div className="col-span-2">
        <Label className="text-xs">Rotation (°)</Label>
        <div className="mt-0.5 flex items-center gap-2">
          <Input
            className="h-8 w-20 shrink-0"
            type="number"
            value={Math.round(el.rotation * 10) / 10}
            onChange={(e) => {
              const r = num(e.target.value);
              setRot(r);
              commitFrame(el.id, { rotation: r });
            }}
          />
          <div className="min-w-0 flex-1" onPointerDown={startPropertyGesture}>
            <Slider
              className="py-1"
              value={[rot]}
              onValueChange={([v]) => {
                if (v == null) return;
                setRot(v);
                setElementFieldLive(el.id, (e) => ({ ...e, rotation: v } as EditorElement));
              }}
              min={-180}
              max={180}
              step={1}
              onValueCommit={() => {
                endPropertyGesture();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TextBlock({
  el,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: TextElement;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: (id: string, update: (e: EditorElement) => EditorElement) => void;
}) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const [fs, setFs] = useState(el.style.fontSize);
  useEffect(() => {
    setFs(el.style.fontSize);
  }, [el.id, el.style.fontSize]);
  const fontOptions = useMemo(() => {
    const cur = el.style.fontFamily;
    if (TEXT_FONT_OPTIONS.some((o) => o.value === cur)) return TEXT_FONT_OPTIONS;
    return [{ value: cur, label: "Current" }, ...TEXT_FONT_OPTIONS];
  }, [el.style.fontFamily]);
  const patch = (f: (t: TextElement) => TextElement) => {
    updateElement(el.id, (t) => (t.type === "text" ? f(t) : t));
  };
  const uline = (el.style.textDecoration ?? "none") === "underline";
  return (
    <>
      <Separator />
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Font</Label>
          <Select
            value={el.style.fontFamily}
            onValueChange={(v) => patch((t) => ({ ...t, style: { ...t.style, fontFamily: v } }))}
          >
            <SelectTrigger className="h-9 border-border/80 bg-background/80 shadow-sm">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Toggle
            pressed={el.style.fontWeight === "bold"}
            onPressedChange={(b) => patch((t) => ({ ...t, style: { ...t.style, fontWeight: b ? "bold" : "normal" } }))}
            className="h-9 font-semibold transition-all hover:bg-muted/80 data-[state=on]:bg-primary/12 data-[state=on]:text-primary data-[state=on]:ring-1 data-[state=on]:ring-primary/25"
            aria-label="Bold"
          >
            B
          </Toggle>
          <Toggle
            pressed={el.style.fontStyle === "italic"}
            onPressedChange={(b) => patch((t) => ({ ...t, style: { ...t.style, fontStyle: b ? "italic" : "normal" } }))}
            className="h-9 italic transition-all hover:bg-muted/80 data-[state=on]:bg-primary/12 data-[state=on]:text-primary data-[state=on]:ring-1 data-[state=on]:ring-primary/25"
            aria-label="Italic"
          >
            I
          </Toggle>
          <Toggle
            pressed={uline}
            onPressedChange={(b) =>
              patch((t) => ({ ...t, style: { ...t.style, textDecoration: b ? "underline" : "none" } }))
            }
            className="h-9 underline transition-all hover:bg-muted/80 data-[state=on]:bg-primary/12 data-[state=on]:text-primary data-[state=on]:ring-1 data-[state=on]:ring-primary/25"
            aria-label="Underline"
          >
            U
          </Toggle>
        </div>
        <div>
          <Label className="text-xs font-medium">Color</Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              className="h-9 w-12 cursor-pointer p-0.5 transition ring-offset-background hover:ring-2 hover:ring-primary/25"
              type="color"
              value={el.style.fill}
              onChange={(e) => patch((t) => ({ ...t, style: { ...t.style, fill: e.target.value } }))}
            />
            <Input
              className="h-9 flex-1 font-mono text-xs transition-shadow hover:ring-1 hover:ring-ring/40"
              value={el.style.fill}
              onChange={(e) => patch((t) => ({ ...t, style: { ...t.style, fill: e.target.value } }))}
            />
          </div>
        </div>
        <div onPointerDown={startPropertyGesture}>
          <div className="mb-0.5 flex items-center justify-between">
            <Label className="text-xs font-medium">Size</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{fs}px</span>
          </div>
          <Slider
            className="py-1"
            value={[fs]}
            onValueChange={([v]) => {
              if (v == null) return;
              setFs(v);
              setElementFieldLive(el.id, (e) => {
                if (e.type !== "text") return e;
                return { ...e, style: { ...e.style, fontSize: v } };
              });
            }}
            min={8}
            max={120}
            step={1}
            onValueCommit={() => {
              endPropertyGesture();
            }}
          />
        </div>
      </div>
    </>
  );
}

function ImageBlock({
  el,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: ImageElement;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: (id: string, update: (e: EditorElement) => EditorElement) => void;
}) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const [z, setZ] = useState(el.crop.scale * 20);
  useEffect(() => {
    setZ(el.crop.scale * 20);
  }, [el.id, el.crop.scale]);
  const patch = (f: (t: ImageElement) => ImageElement) => {
    updateElement(el.id, (t) => (t.type === "image" ? f(t) : t));
  };
  return (
    <>
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Flip horizontal</Label>
          <Toggle
            pressed={el.flipHorizontal}
            onPressedChange={(b) => patch((im) => ({ ...im, flipHorizontal: b }))}
            className="transition-all hover:bg-muted/80"
          />
        </div>
        <div onPointerDown={startPropertyGesture}>
          <div className="mb-0.5 flex items-center justify-between">
            <Label className="text-xs">Crop zoom (non-destructive)</Label>
            <span className="text-xs text-muted-foreground">{(z / 20).toFixed(2)}×</span>
          </div>
          <Slider
            className="py-1"
            value={[z]}
            onValueChange={([v]) => {
              if (v == null) return;
              setZ(v);
              const scale = Math.max(0.1, (v as number) / 20);
              setElementFieldLive(el.id, (e) => {
                if (e.type !== "image") return e;
                return { ...e, crop: { ...e.crop, scale } };
              });
            }}
            min={10}
            max={100}
            step={1}
            onValueCommit={() => {
              endPropertyGesture();
            }}
          />
        </div>
        <p className="text-[10px] leading-tight text-muted-foreground">Original &amp; crop are stored; only the visible area changes.</p>
      </div>
    </>
  );
}
