export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `el_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
