"use client";

import { memo, useCallback, type ComponentRef } from "react";
import { Group } from "react-konva";
import type { EditorElement } from "@/types/editor";
import { useEditorStore } from "@/store/editorStore";
import { ImageElementView } from "./elements/ImageElement";
import { TextElementView } from "./elements/TextElement";

type Frame = { x: number; y: number; width: number; height: number; rotation: number };

type Props = {
  el: EditorElement;
  isSelected: boolean;
  onNodeTransform: () => void;
  attachNode: (id: string, g: ComponentRef<typeof Group> | null) => void;
};

/**
 * Isolated, memoized tree so live property / slider updates on *other* elements
 * do not re-render and fight Konva for this node.
 */
function CanvasItemInner({ el, isSelected, onNodeTransform, attachNode }: Props) {
  const setElementFrame = useEditorStore((s) => s.setElementFrame);
  const onSelect = useCallback(() => {
    useEditorStore.getState().setSelected(el.id);
  }, [el.id]);
  const onDbl = useCallback(() => {
    const s = useEditorStore.getState();
    s.setSelected(el.id);
    s.setTextEditId(el.id);
  }, [el.id]);
  const onFrameEnd = useCallback(
    (f: Frame) => {
      setElementFrame(el.id, f);
    },
    [el.id, setElementFrame]
  );
  const nref = useCallback(
    (g: ComponentRef<typeof Group> | null) => {
      attachNode(el.id, g);
    },
    [el.id, attachNode]
  );

  if (el.type === "text") {
    return (
      <TextElementView
        {...el}
        isSelected={isSelected}
        onSelect={onSelect}
        onDblClick={onDbl}
        onFrameEnd={onFrameEnd}
        onNodeTransform={onNodeTransform}
        nodeRef={nref}
      />
    );
  }
  return (
    <ImageElementView
      el={el as Extract<EditorElement, { type: "image" }>}
      isSelected={isSelected}
      onSelect={onSelect}
      onFrameEnd={onFrameEnd}
      onNodeTransform={onNodeTransform}
      nodeRef={nref}
    />
  );
}

export const CanvasItem = memo(CanvasItemInner);
