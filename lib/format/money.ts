/**
 * Single source of truth for money formatting.
 *
 * Prices are stored as plain numbers with no currency column on `tours`, and
 * reservations record EUR. Anything that renders a price must agree with what
 * gets written to `reservations.total_amount`, or the tour page and the guide
 * dashboard quote different currencies for the same booking.
 */
export const DEFAULT_CURRENCY = "EUR";

export function formatMoney(
  locale: string,
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const value = Number.isFinite(amount) ? amount : 0;

  // Show cents only when there are any: a 2.60 EUR coffee tour must not round
  // to 3 EUR, while a 34 EUR tour should not read as "34.00".
  const hasCents = Math.round(value * 100) % 100 !== 0;
  const digits = hasCents ? 2 : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency}`;
  }
}
