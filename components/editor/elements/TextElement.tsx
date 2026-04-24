"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Group, Rect, Text } from "react-konva";
import { Html } from "react-konva-utils";
import type { TextElement as T } from "@/types/editor";
import { useEditorStore } from "@/store/editorStore";

const MIN = 20;

type Props = T & {
  isSelected: boolean;
  onSelect: () => void;
  onDblClick?: () => void;
  onFrameEnd: (f: { x: number; y: number; width: number; height: number; rotation: number }) => void;
  nodeRef: (g: ComponentRef<typeof Group> | null) => void;
  onNodeTransform?: () => void;
};

/**
 * Double-click opens an inline `textarea` over the box (no modal). Escape reverts, blur saves.
 */
export function TextElementView({
  nodeRef,
  onSelect,
  onDblClick,
  onFrameEnd,
  isSelected,
  onNodeTransform,
  id,
  x,
  y,
  width: w,
  height: h,
  rotation,
  text,
  style,
}: Props) {
  void isSelected;
  const textEditId = useEditorStore((s) => s.textEditId);
  const setTextEditId = useEditorStore((s) => s.setTextEditId);
  const updateElement = useEditorStore((s) => s.updateElement);
  const startPropertyGesture = useEditorStore((s) => s.startPropertyGesture);
  const endPropertyGesture = useEditorStore((s) => s.endPropertyGesture);
  const setElementFieldLive = useEditorStore((s) => s.setElementFieldLive);

  const isEditing = textEditId === id;
  const [draft, setDraft] = useState(text);
  const startTextRef = useRef(text);
  const skipBlurSaveRef = useRef(false);
  const uid = useId();

  useEffect(() => {
    if (isEditing) {
      setDraft(text);
      startTextRef.current = text;
      skipBlurSaveRef.current = false;
    }
  }, [isEditing, id, text]);

  useEffect(() => {
    if (!isEditing) {
      setDraft(text);
    }
  }, [text, isEditing, id]);

  /**
   * Bakes transformer scale into width/height and resets scale to 1 so
   * `fontSize` stays a true point size; only the text box (wrap region) changes.
   */
  const applyTransformToSize = useCallback((n: ComponentRef<typeof Group>) => {
    const sX = n.scaleX();
    const sY = n.scaleY();
    const newW = Math.max(MIN, n.width() * sX);
    const newH = Math.max(MIN, n.height() * sY);
    n.width(newW);
    n.height(newH);
    n.offsetX(newW / 2);
    n.offsetY(newH / 2);
    n.scaleX(1);
    n.scaleY(1);
    const cdx = n.x();
    const cdy = n.y();
    return { x: cdx - newW / 2, y: cdy - newH / 2, width: newW, height: newH, rotation: n.rotation() };
  }, []);

  const handleTransform = useCallback(
    (e: { target: ComponentRef<typeof Group> }) => {
      const n = e.target;
      const f = applyTransformToSize(n);
      setElementFieldLive(id, (el) => (el.type === "text" && el.id === id ? { ...el, ...f } : el));
      onNodeTransform?.();
      n.getLayer()?.batchDraw();
    },
    [id, applyTransformToSize, setElementFieldLive, onNodeTransform]
  );

  const handleTransformStart = useCallback(() => {
    startPropertyGesture();
  }, [startPropertyGesture]);

  const handleTransformEnd = useCallback(
    (e: { target: ComponentRef<typeof Group> }) => {
      const n = e.target;
      const f = applyTransformToSize(n);
      setElementFieldLive(id, (el) => (el.type === "text" && el.id === id ? { ...el, ...f } : el));
      endPropertyGesture();
      onNodeTransform?.();
      n.getLayer()?.batchDraw();
    },
    [id, applyTransformToSize, setElementFieldLive, endPropertyGesture, onNodeTransform]
  );

  const handleDragEnd = useCallback(
    (e: { target: ComponentRef<typeof Group> }) => {
      const n = e.target;
      const wd = n.width() * n.scaleX();
      const he = n.height() * n.scaleY();
      onFrameEnd({ x: n.x() - wd / 2, y: n.y() - he / 2, width: wd, height: he, rotation: n.rotation() });
    },
    [onFrameEnd]
  );

  const commit = useCallback(
    (next: string) => {
      updateElement(id, (e) => (e.type === "text" ? { ...e, text: next } : e));
    },
    [id, updateElement]
  );

  const onTextBlur = useCallback(() => {
    setTextEditId(null);
  }, [setTextEditId]);

  const wasEditing = useRef(false);
  useEffect(() => {
    if (isEditing) {
      wasEditing.current = true;
      return;
    }
    if (wasEditing.current) {
      wasEditing.current = false;
      if (skipBlurSaveRef.current) {
        skipBlurSaveRef.current = false;
        return;
      }
      commit(draft);
    }
  }, [isEditing, draft, commit]);

  const onTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        setDraft(startTextRef.current);
        useEditorStore.setState((s) => {
          const ex = s.elements[id];
          if (!ex || ex.type !== "text") return s;
          return { elements: { ...s.elements, [id]: { ...ex, text: startTextRef.current } } };
        });
        skipBlurSaveRef.current = true;
        setTextEditId(null);
      }
    },
    [id, setTextEditId]
  );

  const fontStyle = style.fontStyle === "italic" ? (style.fontWeight === "bold" ? "bold italic" : "italic") : style.fontWeight === "bold" ? "bold" : "normal";
  const textDecor = (style.textDecoration ?? "none") === "underline" ? "underline" : "";
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <Group
      name="object"
      x={cx}
      y={cy}
      width={w}
      height={h}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={rotation}
      draggable={!isEditing}
      ref={nodeRef}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        onDblClick?.();
      }}
      onDblTap={(e) => {
        e.cancelBubble = true;
        onDblClick?.();
      }}
      onTransform={handleTransform as never}
      onTransformStart={handleTransformStart as never}
      onTransformEnd={handleTransformEnd as never}
      onDragEnd={handleDragEnd as never}
    >
      <Group
        x={0}
        y={0}
        width={w}
        height={h}
        clipX={0}
        clipY={0}
        clipWidth={w}
        clipHeight={h}
        listening={false}
        opacity={isEditing ? 0.02 : 1}
      >
        <Text
          x={0}
          y={0}
          width={w}
          height={h}
          text={isEditing ? draft : text}
          fontSize={style.fontSize}
          fill={style.fill}
          fontFamily={style.fontFamily}
          fontStyle={fontStyle}
          textDecoration={textDecor}
          lineHeight={1.25}
          padding={0}
          wrap="word"
          verticalAlign="top"
          name="text-body"
          listening={false}
        />
      </Group>
      {isEditing && (
        <Html
          groupProps={{ x: 0, y: 0, width: w, height: h, listening: true } as never}
          divProps={{ className: "z-[20]", style: { zIndex: 20 } } as never}
        >
          <label htmlFor={uid} className="sr-only">
            Edit text
          </label>
          <textarea
            id={uid}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onTextBlur}
            onKeyDown={onTextKeyDown}
            spellCheck
            className="box-border m-0 min-h-0 w-full resize-none overflow-auto border-0 bg-transparent p-0 text-inherit antialiased shadow-none outline-none selection:bg-primary/10 focus:border-0 focus:shadow-none focus:ring-0 focus:outline-none"
            style={{
              width: w,
              minHeight: h,
              maxHeight: Math.max(h, 400),
              fontSize: style.fontSize,
              fontFamily: style.fontFamily,
              fontWeight: style.fontWeight,
              fontStyle: style.fontStyle,
              textDecoration: (style.textDecoration ?? "none") === "underline" ? "underline" : "none",
              color: style.fill,
              lineHeight: 1.25,
              caretColor: style.fill,
              WebkitTextFillColor: style.fill,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </Html>
      )}
      <Rect x={0} y={0} width={w} height={h} fill="rgba(0,0,0,0.0001)" name="text-hit" />
    </Group>
  );
}
