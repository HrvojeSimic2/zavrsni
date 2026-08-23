/**
 * Server actions and route handlers cannot reach the request locale of the page
 * they redirect to, so they hand over a message *key* (see `auth-flash.ts` and
 * `guide-flash.ts`) instead of a finished sentence. The receiving page resolves
 * it with the helper below.
 */
export type FlashTranslator = {
  has: (key: string) => boolean;
  (key: string, values?: Record<string, string | number>): string;
};

/**
 * Turns a query-param value into display text: translated when it is a known
 * key under `prefix`, passed through verbatim otherwise (raw Supabase errors and
 * Zod issue messages take that path).
 */
export function resolveFlash(
  t: FlashTranslator,
  prefix: string,
  raw: string | undefined,
  values?: Record<string, string | number>
) {
  if (!raw) return "";
  const key = `${prefix}.${raw}`;
  return t.has(key) ? t(key, values) : raw;
}
