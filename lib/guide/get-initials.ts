/** Two-letter avatar fallback for a guide or traveller name. */
export function getInitials(name: string | null | undefined): string {
  const parts = String(name ?? "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
}
