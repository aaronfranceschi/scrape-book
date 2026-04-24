"use client";

import { useCallback } from "react";
import type { ComponentRef } from "react";
import { Group, Image as KImage, Rect } from "react-konva";
import useImage from "use-image";
import type { ImageElement as I } from "@/types/editor";

const MIN = 20;

type Props = {
  el: I;
  isSelected: boolean;
  onSelect: () => void;
  onFrameEnd: (f: { x: number; y: number; width: number; height: number; rotation: number }) => void;
  nodeRef: (g: ComponentRef<typeof Group> | null) => void;
  /** Fires while resizing/rotating so the parent can `Transformer#forceUpdate`. */
  onNodeTransform?: () => void;
};

/** Map normalized 0-1 crop (+ optional `scale` zoom) to source pixel `crop` for Konva. */
function toPixelCrop(ow: number, oh: number, c: I["crop"]) {
  let x = c.x * ow;
  let y = c.y * oh;
  let w = c.width * ow;
  let h = c.height * oh;
  if (c.scale && c.scale !== 1) {
    const nw = w / c.scale;
    const nh = h / c.scale;
    x = x + (w - nw) / 2;
    y = y + (h - nh) / 2;
    w = nw;
    h = nh;
  }
  return { x, y, width: w, height: h };
}

/**
 * A `Transform`-bound Group must report a single w×h box. Flipping the image
 * with negative `scaleX` and `x:w` can inflate `getClientRect` used by
 * `Transformer` — the inner Group clips to the frame so handles stay aligned.
 */
export function ImageElementView({ el, isSelected, onSelect, onFrameEnd, nodeRef, onNodeTransform }: Props) {
  void isSelected; // parent passes for future use; selection is shown by Transformer only
  const { x, y, width: w, height: h, rotation, src, flipHorizontal, originalWidth, originalHeight, crop } = el;
  const [image, status] = useImage(src, "anonymous");
  const pCrop = toPixelCrop(originalWidth, originalHeight, crop);
  const failed = status === "failed";

  const handleTransformEnd = useCallback(
    (e: { target: ComponentRef<typeof Group> }) => {
      const n = e.target;
      const sX = Math.abs(n.scaleX());
      const sY = Math.abs(n.scaleY());
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
      onFrameEnd({ x: cdx - newW / 2, y: cdy - newH / 2, width: newW, height: newH, rotation: n.rotation() });
      n.getLayer()?.batchDraw();
    },
    [onFrameEnd]
  );

  const handleDragEnd = useCallback(
    (e: { target: ComponentRef<typeof Group> }) => {
      const n = e.target;
      const wd = n.width() * Math.abs(n.scaleX());
      const he = n.height() * Math.abs(n.scaleY());
      onFrameEnd({ x: n.x() - wd / 2, y: n.y() - he / 2, width: wd, height: he, rotation: n.rotation() });
    },
    [onFrameEnd]
  );

  const cx = x + w / 2;
  const cy = y + h / 2;
  const loading = status === "loading";

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
      draggable
      ref={nodeRef}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTransform={() => onNodeTransform?.()}
      onTransformStart={() => onNodeTransform?.()}
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
      >
        {loading && <Rect x={0} y={0} width={w} height={h} fill="#e2e8f0" cornerRadius={2} listening={false} />}
        {failed && <Rect x={0} y={0} width={w} height={h} fill="#fee2e2" cornerRadius={2} listening={false} />}
        {image && !failed && (
          <KImage
            x={flipHorizontal ? w : 0}
            y={0}
            image={image}
            width={w}
            height={h}
            crop={pCrop}
            scaleX={flipHorizontal ? -1 : 1}
            listening={false}
          />
        )}
      </Group>
      <Rect x={0} y={0} width={w} height={h} fill="rgba(0,0,0,0.0001)" name="image-hit" />
    </Group>
  );
}
