import { PAGE_H, PAGE_W } from "@/types/editor";

/** How much horizontal room we want outside the page (per side) at minimum, in “stage” space. */
const MARGIN = 32;

/**
 * min stage width: page + margins (must be ≥ `PAGE_W`).
 * max: keeps files reasonable on ultrawide.
 */
const STAGE_W_MIN = PAGE_W + MARGIN * 2; // 880
const STAGE_W_CAP = 1200;

const STAGE_H = PAGE_H + MARGIN * 2; // 1120, centers page vertically

/**
 * `PAGE_OFFSET` was previously fixed; center column now resizes, so the stage
 * uses these helpers with runtime `stw` / `sth`.
 */
export function pageOffsetsForStage(stw: number, sth: number) {
  return {
    ox: (stw - PAGE_W) / 2,
    oy: (sth - PAGE_H) / 2,
  };
}

/**
 * From the canvas container’s inner width, pick a logical stage width and a
 * CSS scale so the map never needs a horizontal page scrollbar in normal UIs.
 */
export function sizeStageToContainerWidth(containerWidth: number) {
  const wAvail = Math.max(0, containerWidth - 4);
  if (wAvail < 1) {
    return { stw: STAGE_W_MIN, sth: STAGE_H, layoutScale: 1 };
  }
  const target = Math.min(STAGE_W_CAP, Math.max(STAGE_W_MIN, wAvail));
  if (wAvail < STAGE_W_MIN) {
    return { stw: STAGE_W_MIN, sth: STAGE_H, layoutScale: wAvail / STAGE_W_MIN };
  }
  return { stw: target, sth: STAGE_H, layoutScale: 1 };
}

// Legacy names used in some imports — keep in sync with dynamic sizing in `CanvasStage`.
export const STAGE_H_FIXED = STAGE_H;

/**
 * After `transform: scale(s)` with `transformOrigin: (ox, oy)px` on a box
 * 0,0 to (w, h) (stage space), the axis-aligned bounds of the painted result.
 * Used to size the scrollable wrapper; origin is the white-paper center for zoom.
 */
export function aabbAfterUniformScale(
  w: number,
  h: number,
  s: number,
  ox: number,
  oy: number
) {
  const map = (x: number, y: number) => {
    return { x: s * (x - ox) + ox, y: s * (y - oy) + oy };
  };
  const p = [map(0, 0), map(w, 0), map(w, h), map(0, h)];
  const minX = Math.min(...p.map((q) => q.x));
  const minY = Math.min(...p.map((q) => q.y));
  const maxX = Math.max(...p.map((q) => q.x));
  const maxY = Math.max(...p.map((q) => q.y));
  return { width: maxX - minX, height: maxY - minY, minX, minY, maxX, maxY };
}
