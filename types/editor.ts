/**
 * Serializable document model — maps cleanly to a MongoDB document later:
 * { _id, title, pages, elements, updatedAt, ... } where `elements` can be
 * a nested object map or a sub-collection keyed by id.
 */
export const PAGE_W = 816; // US Letter at 96dpi width
export const PAGE_H = 1056; // US Letter at 96dpi height

export type TextStyle = {
  fontSize: number;
  fill: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  /** Konva uses `underline` or omit for none. */
  textDecoration: "none" | "underline";
  fontFamily: string;
};

/**
 * Image crop is stored in normalized 0..1 space relative to the original
 * image dimensions. This stays serializable and keeps the full asset
 * (data URL) separate from the visible region.
 */
export type ImageCrop = {
  /** Left edge, 0..1 */
  x: number;
  /** Top edge, 0..1 */
  y: number;
  /** Width of visible region, 0..1 */
  width: number;
  /** Height of visible region, 0..1 */
  height: number;
  /** Optional zoom within the crop (1 = default). Baked as extra scale. */
  scale: number;
};

export type BaseElement = {
  id: string;
  type: "text" | "image";
  pageId: string;
  /**
   * Top-left of the unrotated local box, in page space (before rotation around center).
   * Matches PowerPoint/Canva-style "position" when rotation is 0.
   */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise, rotation around the center of the local box. */
  rotation: number;
};

export type TextElement = BaseElement & {
  type: "text";
  text: string;
  style: TextStyle;
};

export type ImageElement = BaseElement & {
  type: "image";
  /** data URL or same-origin URL — must be CORS-safe for export if remote */
  src: string;
  originalWidth: number;
  originalHeight: number;
  crop: ImageCrop;
  flipHorizontal: boolean;
};

export type EditorElement = TextElement | ImageElement;

export type PageModel = {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Bottom → top z-order: element ids */
  elementOrder: string[];
};

/**
 * What we persist: normalized pages, flat element map, and selection.
 * `history` / `future` are undo stacks of immutable snapshots of this payload.
 */
export type PersistedEditor = {
  pages: PageModel[];
  elements: Record<string, EditorElement>;
  currentPageId: string;
  selectedElementId: string | null;
};

export type HistorySnapshot = Omit<PersistedEditor, "currentPageId" | "selectedElementId"> & {
  currentPageId: string;
  selectedElementId: string | null;
};
