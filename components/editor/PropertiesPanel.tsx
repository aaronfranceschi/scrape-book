"use client";

import { useEffect, useMemo, useState } from "react";
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

/** Fields are dark by default to match the app shell. */
const fieldClass =
  "mt-0.5 h-8 border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-sm placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-primary";

function PropSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{title}</h4>
      {children}
    </div>
  );
}

/**
 * Right rail: Position → Size → Rotation → Font (text) → Formatting
 */
export function PropertiesPanel({ className }: { className?: string }) {
  const { elements, selectedElementId, startPropertyGesture, endPropertyGesture, setElementFieldLive } = useEditorStore();
  const el = selectedElementId ? elements[selectedElementId] : null;

  if (!el) {
    return (
      <div
        className={cn(
          "w-full max-w-[280px] rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300",
          className
        )}
      >
        <p className="text-xs">Select an object on the page to edit its properties.</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-[280px] space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 shadow-sm", className)}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Properties</h3>
        <p className="text-xs text-zinc-400">{el.type === "text" ? "Text" : "Image"}</p>
      </div>
      <Separator className="bg-zinc-800" />
      <PositionSection
        el={el}
        startPropertyGesture={startPropertyGesture}
        endPropertyGesture={endPropertyGesture}
        setElementFieldLive={setElementFieldLive}
      />
      <SizeSection
        el={el}
        startPropertyGesture={startPropertyGesture}
        endPropertyGesture={endPropertyGesture}
        setElementFieldLive={setElementFieldLive}
      />
      <RotationSection
        el={el}
        startPropertyGesture={startPropertyGesture}
        endPropertyGesture={endPropertyGesture}
        setElementFieldLive={setElementFieldLive}
      />
      {el.type === "text" && (
        <TextFontSection
          el={el}
          startPropertyGesture={startPropertyGesture}
          endPropertyGesture={endPropertyGesture}
          setElementFieldLive={setElementFieldLive}
        />
      )}
      {el.type === "text" && <TextFormattingSection el={el} />}
      {el.type === "image" && (
        <ImageFormattingSection
          el={el}
          startPropertyGesture={startPropertyGesture}
          endPropertyGesture={endPropertyGesture}
          setElementFieldLive={setElementFieldLive}
        />
      )}
    </div>
  );
}

type LiveField = (id: string, update: (e: EditorElement) => EditorElement) => void;

function PositionSection({
  el,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: EditorElement;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: LiveField;
}) {
  return (
    <PropSection title="Position">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-zinc-400">X</Label>
          <Input
            className={fieldClass}
            type="number"
            value={Math.round(el.x)}
            onChange={(e) => {
              startPropertyGesture();
              const x = num(e.target.value);
              setElementFieldLive(el.id, (b) => (b.id === el.id ? { ...b, x } as EditorElement : b));
            }}
            onBlur={endPropertyGesture}
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Y</Label>
          <Input
            className={fieldClass}
            type="number"
            value={Math.round(el.y)}
            onChange={(e) => {
              startPropertyGesture();
              const y = num(e.target.value);
              setElementFieldLive(el.id, (b) => (b.id === el.id ? { ...b, y } as EditorElement : b));
            }}
            onBlur={endPropertyGesture}
          />
        </div>
      </div>
    </PropSection>
  );
}

function SizeSection({
  el,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: EditorElement;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: LiveField;
}) {
  return (
    <PropSection title="Size">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-zinc-400">W</Label>
          <Input
            className={fieldClass}
            type="number"
            value={Math.round(el.width)}
            onChange={(e) => {
              startPropertyGesture();
              const width = Math.max(20, num(e.target.value));
              setElementFieldLive(el.id, (b) => (b.id === el.id ? { ...b, width } as EditorElement : b));
            }}
            onBlur={endPropertyGesture}
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">H</Label>
          <Input
            className={fieldClass}
            type="number"
            value={Math.round(el.height)}
            onChange={(e) => {
              startPropertyGesture();
              const height = Math.max(20, num(e.target.value));
              setElementFieldLive(el.id, (b) => (b.id === el.id ? { ...b, height } as EditorElement : b));
            }}
            onBlur={endPropertyGesture}
          />
        </div>
      </div>
    </PropSection>
  );
}

function RotationSection({
  el,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: EditorElement;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: LiveField;
}) {
  const [rot, setRot] = useState(el.rotation);
  useEffect(() => {
    setRot(el.rotation);
  }, [el.id, el.rotation]);
  return (
    <PropSection title="Rotation">
      <div className="flex items-center gap-2">
        <Input
          className={cn(fieldClass, "w-[4.5rem] shrink-0 tabular-nums")}
          type="number"
          value={Math.round(el.rotation * 10) / 10}
          onChange={(e) => {
            startPropertyGesture();
            const r = num(e.target.value);
            setRot(r);
            setElementFieldLive(el.id, (b) => (b.id === el.id ? { ...b, rotation: r } as EditorElement : b));
          }}
          onBlur={endPropertyGesture}
        />
        <div className="min-w-0 flex-1">
          <Slider
            className="py-1"
            value={[rot]}
            onValueChange={([v]) => {
              if (v == null) return;
              startPropertyGesture();
              setRot(v);
              setElementFieldLive(el.id, (b) => (b.id === el.id ? { ...b, rotation: v } as EditorElement : b));
            }}
            min={-180}
            max={180}
            step={1}
            onValueCommit={endPropertyGesture}
          />
        </div>
      </div>
      <p className="text-[10px] text-zinc-400">Degrees</p>
    </PropSection>
  );
}

function TextFontSection({
  el,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: TextElement;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: LiveField;
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
  return (
    <PropSection title="Font">
      <div className="space-y-2">
        <Select
          value={el.style.fontFamily}
          onValueChange={(v) => patch((t) => ({ ...t, style: { ...t.style, fontFamily: v } }))}
        >
          <SelectTrigger className="h-9 border-zinc-700 bg-zinc-900 text-zinc-100">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent className="border border-zinc-700 bg-zinc-900 text-zinc-100">
            {fontOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <div className="mb-0.5 flex items-center justify-between">
            <Label className="text-xs text-zinc-400">Size</Label>
            <span className="text-xs tabular-nums text-zinc-400">{fs}px</span>
          </div>
          <Slider
            className="py-1"
            value={[fs]}
            onValueChange={([v]) => {
              if (v == null) return;
              startPropertyGesture();
              setFs(v);
              setElementFieldLive(el.id, (e) => {
                if (e.type !== "text") return e;
                return { ...e, style: { ...e.style, fontSize: v } };
              });
            }}
            min={8}
            max={120}
            step={1}
            onValueCommit={endPropertyGesture}
          />
        </div>
      </div>
    </PropSection>
  );
}

function TextFormattingSection({ el }: { el: TextElement }) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const patch = (f: (t: TextElement) => TextElement) => {
    updateElement(el.id, (t) => (t.type === "text" ? f(t) : t));
  };
  const uline = (el.style.textDecoration ?? "none") === "underline";
  const tgl =
    "h-9 border border-zinc-700 bg-zinc-900 font-medium text-zinc-100 transition-all hover:bg-zinc-800 data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:ring-1 data-[state=on]:ring-primary/30";
  return (
    <PropSection title="Formatting">
      <div className="grid grid-cols-3 gap-1.5">
        <Toggle
          pressed={el.style.fontWeight === "bold"}
          onPressedChange={(b) => patch((t) => ({ ...t, style: { ...t.style, fontWeight: b ? "bold" : "normal" } }))}
          className={cn(tgl, "font-bold")}
          aria-label="Bold"
        >
          B
        </Toggle>
        <Toggle
          pressed={el.style.fontStyle === "italic"}
          onPressedChange={(b) => patch((t) => ({ ...t, style: { ...t.style, fontStyle: b ? "italic" : "normal" } }))}
          className={cn(tgl, "italic")}
          aria-label="Italic"
        >
          I
        </Toggle>
        <Toggle
          pressed={uline}
          onPressedChange={(b) => patch((t) => ({ ...t, style: { ...t.style, textDecoration: b ? "underline" : "none" } }))}
          className={cn(tgl, "underline")}
          aria-label="Underline"
        >
          U
        </Toggle>
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Color</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            className="h-9 w-12 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-0.5 ring-offset-zinc-900"
            type="color"
            value={el.style.fill}
            onChange={(e) => patch((t) => ({ ...t, style: { ...t.style, fill: e.target.value } }))}
          />
          <Input
            className={cn(fieldClass, "font-mono text-xs")}
            value={el.style.fill}
            onChange={(e) => patch((t) => ({ ...t, style: { ...t.style, fill: e.target.value } }))}
          />
        </div>
      </div>
    </PropSection>
  );
}

function ImageFormattingSection({
  el,
  startPropertyGesture,
  endPropertyGesture,
  setElementFieldLive,
}: {
  el: ImageElement;
  startPropertyGesture: () => void;
  endPropertyGesture: () => void;
  setElementFieldLive: LiveField;
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
    <PropSection title="Formatting">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-zinc-400">Flip horizontal</Label>
        <Toggle
          pressed={el.flipHorizontal}
          onPressedChange={(b) => patch((im) => ({ ...im, flipHorizontal: b }))}
          className="shrink-0 border border-zinc-700 bg-zinc-900 text-zinc-100 transition-all hover:bg-zinc-800 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        />
      </div>
      <div>
        <div className="mb-0.5 flex items-center justify-between">
          <Label className="text-xs text-zinc-400">Crop zoom</Label>
          <span className="text-xs tabular-nums text-zinc-400">{(z / 20).toFixed(2)}×</span>
        </div>
        <Slider
          className="py-1"
          value={[z]}
          onValueChange={([v]) => {
            if (v == null) return;
            startPropertyGesture();
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
          onValueCommit={endPropertyGesture}
        />
        <p className="text-[10px] leading-tight text-zinc-400">Non-destructive crop. Original is stored.</p>
      </div>
    </PropSection>
  );
}
