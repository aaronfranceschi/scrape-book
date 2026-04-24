/**
 * Isolated export — PNG region helper + PDF (jspdf) + HTML placeholders.
 * jspdf is loaded only when `downloadPngDataUrlAsPdf` runs to keep the main editor chunk smaller and avoid rare bundler/runtime issues.
 */

import { PAGE_H, PAGE_W } from "@/types/editor";

export type PngExportOptions = {
  pixelRatio?: number;
  mimeType?: "image/png" | "image/jpeg";
  quality?: number;
};

/** Konva `Layer` — loose typing to avoid Node-only `konva` in SSR. */
type KonvaLayer = { toDataURL: (v: object) => string };

export function exportLayerRegionToPngDataUrl(
  layer: KonvaLayer,
  rect: { x: number; y: number; width: number; height: number },
  opts: PngExportOptions = {}
): string {
  const { pixelRatio = 2, mimeType = "image/png", quality = 0.95 } = opts;
  if (typeof window === "undefined") return "";
  return layer.toDataURL({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    pixelRatio,
    mimeType,
    quality: mimeType === "image/png" ? undefined : quality,
  });
}

/**
 * One-page letter-sized PDF from a PNG data URL. Uses pt units (96 CSS px
 * → pt at 8.5×11" matches US Letter: 612×792 pt = 8.5×11 at 72 dpi).
 */
export function downloadPngDataUrlAsPdf(pngDataUrl: string, fileName = "scrapbook-page.pdf"): void {
  if (typeof window === "undefined" || !pngDataUrl) return;
  const wPt = (PAGE_W / 96) * 72;
  const hPt = (PAGE_H / 96) * 72;
  void import("jspdf").then(
    (mod) => {
      const jsPDF = mod.default;
      const doc = new jsPDF({ unit: "pt", format: [wPt, hPt], orientation: "portrait" });
      doc.addImage(pngDataUrl, "PNG", 0, 0, wPt, hPt);
      doc.save(fileName);
    },
    (e) => {
      console.error("jspdf load failed", e);
    }
  );
}

export type HtmlExportContext = {
  pageWidth: number;
  pageHeight: number;
  designJson: unknown;
};

export function exportToHtmlString(ctx: HtmlExportContext): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Scrapbook export</title>
<style>body{margin:0;background:#e5e7eb}</style></head><body>
<main style="width:${ctx.pageWidth}px;height:${ctx.pageHeight}px;margin:0 auto;background:#fff;box-shadow:0 0 0 1px #ccc">
  <p style="font-family:system-ui;padding:24px">HTML export placeholder. Map \`designJson\` in exportCanvas / a server route.</p>
</main></body></html>`;
}
