"use client";

import type { ComponentRef } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Group, Layer, Rect, Stage, Transformer } from "react-konva";
import { useShallow } from "zustand/react/shallow";
import { PAGE_H, PAGE_W } from "@/types/editor";
import { getSafeCurrentPage } from "@/lib/mockPersistence";
import { useEditorStore, selectElementsForPage } from "@/store/editorStore";
import { aabbAfterUniformScale, pageOffsetsForStage, sizeStageToContainerWidth } from "@/lib/editorLayout";
import { CanvasItem } from "./CanvasItem";

const MIN = 20;

type Props = {
  /** User zoom (toolbar) — multiplied with automatic fit-to-column scale. */
  zoom: number;
  /** Measured from the scroll work area — avoids 0 / cyclic width and fixes zoom. */
  containerWidth: number;
  onLayerReady: (ref: { getPng: () => string; getLayer: () => unknown }) => void;
};

type Off = { ox: number; oy: number };

/**
 * The stage width is driven by the center column (ResizeObserver) so a fixed
 * 1400px canvas never spills past the layout (no page-level horizontal bar).
 * The white page stays mathematically centered in the stage.
 */
export function CanvasStage({ zoom, containerWidth, onLayerReady }: Props) {
  const { elements, pages, currentPageId, selectedElementId, setSelected } = useEditorStore(
    useShallow((s) => ({
      elements: s.elements,
      pages: s.pages,
      currentPageId: s.currentPageId,
      selectedElementId: s.selectedElementId,
      setSelected: s.setSelected,
    }))
  );
  const page = getSafeCurrentPage(pages, currentPageId);

  const { stw, sth, layoutScale } = useMemo(
    () => sizeStageToContainerWidth(containerWidth),
    [containerWidth]
  );
  const pageRectRef = useRef<Off>(pageOffsetsForStage(stw, sth));

  const trRef = useRef<ComponentRef<typeof Transformer> | null>(null);
  const selectedFrame = useMemo(() => {
    if (!selectedElementId) return null;
    const e = elements[selectedElementId];
    if (!e) return null;
    return [e.x, e.y, e.width, e.height, e.rotation].map((n) => Math.round(n * 1000) / 1000).join(",");
  }, [elements, selectedElementId]);
  const layerRef = useRef<ComponentRef<typeof Layer> | null>(null);
  const nodeMap = useRef<Record<string, ComponentRef<typeof Group>>>({});
  const onLayerReadyRef = useRef(onLayerReady);
  onLayerReadyRef.current = onLayerReady;

  const attachNode = useCallback((id: string, g: ComponentRef<typeof Group> | null) => {
    if (g) nodeMap.current[id] = g;
    else delete nodeMap.current[id];
  }, []);

  const { ox, oy } = useMemo(() => pageOffsetsForStage(stw, sth), [stw, sth]);
  pageRectRef.current = { ox, oy };

  const ordered = selectElementsForPage(page, elements);
  const orderSig = ordered.map((e) => e.id).join(",");

  const attach = useCallback(() => {
    const t = trRef.current;
    if (!t) return;
    if (!selectedElementId) {
      t.nodes([]);
      t.getLayer()?.batchDraw();
      return;
    }
    const g = nodeMap.current[selectedElementId];
    if (g) t.nodes([g]);
    else t.nodes([]);
    t.getLayer()?.batchDraw();
  }, [selectedElementId]);

  useEffect(() => {
    attach();
  }, [attach, orderSig]);

  const syncTransformer = useCallback(() => {
    trRef.current?.forceUpdate();
    trRef.current?.getLayer()?.batchDraw();
  }, []);

  useLayoutEffect(() => {
    syncTransformer();
  }, [selectedFrame, orderSig, selectedElementId, stw, sth, syncTransformer]);

  const totalScale = Math.max(0.2, layoutScale * zoom);
  /** Zoom around the center of the white “paper” (not the stage’s top-left). */
  const pCx = ox + PAGE_W / 2;
  const pCy = oy + PAGE_H / 2;
  const aabb = useMemo(
    () => aabbAfterUniformScale(stw, sth, totalScale, pCx, pCy),
    [stw, sth, totalScale, pCx, pCy]
  );

  return (
    <div className="flex w-full min-w-0 max-w-full shrink-0 items-center justify-center">
      <div
        className="shrink-0"
        style={{
          position: "relative",
          width: aabb.width,
          height: aabb.height,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -aabb.minX,
            top: -aabb.minY,
            width: stw,
            height: sth,
            transform: `scale(${totalScale})`,
            transformOrigin: `${pCx}px ${pCy}px`,
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-lg border border-zinc-700/40 bg-background">
            <Stage
              className="block"
              width={stw}
              height={sth}
              onContextMenu={(e) => e.evt.preventDefault()}
            >
              <Layer
                ref={(c) => {
                  layerRef.current = c;
                  if (c) {
                    onLayerReadyRef.current({
                      getPng: () => {
                        if (typeof window === "undefined") return "";
                        const { ox: x0, oy: y0 } = pageRectRef.current;
                        return c.toDataURL({
                          x: x0,
                          y: y0,
                          width: PAGE_W,
                          height: PAGE_H,
                          pixelRatio: 2,
                          mimeType: "image/png",
                        });
                      },
                      getLayer: () => layerRef.current,
                    });
                  }
                }}
              >
                {/* Dark pasteboard around the white paper (topbar-matching theme). */}
                <Rect
                  x={0}
                  y={0}
                  width={stw}
                  height={sth}
                  name="background"
                  fill="hsl(220 8% 10%)"
                  onPointerDown={() => {
                    setSelected(null);
                  }}
                  listening
                />
                <Group x={ox} y={oy} name="pageGroup">
                  <Rect
                    x={0}
                    y={0}
                    width={PAGE_W}
                    height={PAGE_H}
                    name="page-bg"
                    fill="#ffffff"
                    shadowBlur={4}
                    shadowColor="black"
                    shadowOffset={{ x: 0, y: 2 }}
                    shadowOpacity={0.12}
                    onPointerDown={() => {
                      setSelected(null);
                    }}
                  />
                  {ordered.map((el) => {
                    if (!el) return null;
                    return (
                      <CanvasItem
                        key={el.id}
                        el={el}
                        isSelected={el.id === selectedElementId}
                        onNodeTransform={syncTransformer}
                        attachNode={attachNode}
                      />
                    );
                  })}
                </Group>
                <Transformer
                  ref={trRef}
                  rotateEnabled
                  flipEnabled={false}
                  useSingleNodeRotation
                  keepRatio={false}
                  borderStroke="hsl(217, 91%, 60%)"
                  borderStrokeWidth={1.5}
                  borderDash={[2, 2]}
                  padding={6}
                  anchorSize={8}
                  anchorFill="#e4e4e7"
                  ignoreStroke
                  onTransform={syncTransformer}
                  onTransformEnd={syncTransformer}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}
