import { PAGE_H, PAGE_W, type EditorElement, type ImageElement, type PageModel, type TextElement } from "@/types/editor";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toPixelCrop(ow: number, oh: number, c: ImageElement["crop"]) {
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
 * One printable page as a self-contained static HTML file. Images use
 * the same `src` (often data URLs) as in the editor.
 */
export function buildScrapbookPageHtml(page: PageModel, elements: Record<string, EditorElement>): string {
  const order = page.elementOrder.map((id) => elements[id]).filter(Boolean);
  const out: string[] = [];

  for (const el of order) {
    if (el.type === "text") {
      const t = el as TextElement;
      const { x, y, width, height, rotation, text, style } = t;
      const fam = style.fontFamily.replace(/"/g, "&quot;");
      const tdec = (style.textDecoration ?? "none") === "underline" ? "underline" : "none";
      const inner = escapeHtml(text).replace(/\n/g, "<br />");
      out.push(
        `<div class="el" style="left:${x}px;top:${y}px;width:${width}px;height:${height}px;transform:rotate(${rotation}deg)">` +
          `<div class="t" style="font-size:${style.fontSize}px;font-family:${fam};font-weight:${style.fontWeight};font-style:${style.fontStyle};text-decoration:${tdec};color:${style.fill}">${inner}</div>` +
          `</div>`
      );
    } else {
      const im = el as ImageElement;
      const { x, y, width, height, rotation, src, originalWidth, originalHeight, crop, flipHorizontal: fh } = im;
      const p = toPixelCrop(originalWidth, originalHeight, crop);
      const sx = width / p.width;
      const sy = height / p.height;
      const imgW = originalWidth * sx;
      const imgH = originalHeight * sy;
      const offX = -p.x * sx;
      const offY = -p.y * sy;
      const esc = src.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      const imgTag =
        `<img src="${esc}" alt="" width="${imgW}" height="${imgH}" style="position:absolute;left:${offX}px;top:${offY}px" />`;
      out.push(
        `<div class="el" style="left:${x}px;top:${y}px;width:${width}px;height:${height}px;transform:rotate(${rotation}deg)">` +
          `<div class="ic" style="position:absolute;inset:0;overflow:hidden;${fh ? "transform:scaleX(-1)" : ""}">` +
          imgTag +
          `</div></div>`
      );
    }
  }

  const body = out.length
    ? out.join("\n    ")
    : `<p class="t" style="padding:1rem;color:#64748b">Empty page</p>`;

  return (
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Scrapbook page</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #c6cbd4; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 24px; }
    .page { position: relative; width: ${page.width || PAGE_W}px; height: ${page.height || PAGE_H}px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.12); }
    .el { position: absolute; box-sizing: border-box; transform-origin: center center; }
    .t { position: absolute; left: 0; top: 0; right: 0; bottom: 0; margin: 0; padding: 2px; overflow: hidden; line-height: 1.25; }
    .ic { }
  </style>
</head>
<body>
  <div class="page" style="width:${page.width || PAGE_W}px;height:${page.height || PAGE_H}px">
    ${body}
  </div>
</body>
</html>
`
  );
}

export function downloadHtml(filename: string, page: PageModel, elements: Record<string, EditorElement>): void {
  if (typeof document === "undefined") return;
  const html = buildScrapbookPageHtml(page, elements);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
