/**
 * Preset stacks for the properties panel (value = CSS font-family string).
 * First three match next/font in app/layout (loaded for canvas + UI).
 */
export const THEME_TEXT_SERIF = "Fraunces, Georgia, 'Times New Roman', serif";
export const THEME_TEXT_HAND = "Caveat, cursive";
export const THEME_TEXT_MARKER = "'Permanent Marker', 'Trebuchet MS', cursive";
export const THEME_INK = "#0a0a0a";

export const TEXT_FONT_OPTIONS: { value: string; label: string }[] = [
  { value: THEME_TEXT_SERIF, label: "Editorial (serif)" },
  { value: THEME_TEXT_HAND, label: "Hand script" },
  { value: THEME_TEXT_MARKER, label: "Marker" },
  { value: "Inter, system-ui, sans-serif", label: "Inter" },
  { value: "system-ui, -apple-system, Segoe UI, sans-serif", label: "System UI" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times" },
  { value: "'Palatino Linotype', Palatino, Georgia, serif", label: "Palatino" },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: "Trebuchet" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "'Courier New', Courier, monospace", label: "Courier" },
  { value: "'Comic Sans MS', 'Chalkboard SE', cursive", label: "Comic Sans" },
];
