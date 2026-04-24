/**
 * Returns a data URL of a small gradient — safe for canvas `toDataURL` (no CORS taint).
 * Only runs in the browser.
 */
export function createSampleDataUrl(
  w = 480,
  h = 360
): string {
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) return "";
  const grd = g.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, "#7dd3fc");
  grd.addColorStop(0.5, "#a78bfa");
  grd.addColorStop(1, "#fb923c");
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "white";
  g.font = "bold 28px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("Sample", w / 2, h / 2);
  return c.toDataURL("image/png");
}
