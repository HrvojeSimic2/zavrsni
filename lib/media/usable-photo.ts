/**
 * A photo, or nothing.
 *
 * Rows without a picture carry the literal string "/placeholder.svg", which
 * loads fine and so never triggers an image fallback — it just paints a blank
 * grey rectangle where a face or a place should be. Callers can then choose a
 * real fallback (initials, an empty frame) instead of showing the placeholder.
 */
export function usablePhoto(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.replace(/^\//, "") === "placeholder.svg") return null;
  return trimmed;
}
