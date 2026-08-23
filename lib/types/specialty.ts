/**
 * What a guide is into.
 *
 * These used to be the categories of a tour, which meant a guide's interests
 * only existed as a side effect of the products they had published. They are
 * now a column on the guide, so a guide who has published nothing still has an
 * identity.
 */
export const SPECIALTIES = [
  "food",
  "nature",
  "culture",
  "adventure",
  "history",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export function isSpecialty(value: unknown): value is Specialty {
  return (
    typeof value === "string" && (SPECIALTIES as readonly string[]).includes(value)
  );
}

/** Keeps only the values the `guides_specialties_valid` constraint accepts. */
export function toSpecialties(value: unknown): Specialty[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isSpecialty)));
}
