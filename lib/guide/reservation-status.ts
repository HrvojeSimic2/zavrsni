import type { ReservationStatus } from "@/lib/guide/guide-dashboard-data";

export { formatMoney, DEFAULT_CURRENCY } from "@/lib/format/money";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** Message key under `GuideDashboard.status`, paired with the badge styling. */
export type ReservationBadgeKey =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export function reservationBadge(status: ReservationStatus | null | undefined): {
  key: ReservationBadgeKey;
  variant: BadgeVariant;
} {
  switch (status) {
    case "confirmed":
      return { key: "confirmed", variant: "default" };
    case "cancelled":
      return { key: "cancelled", variant: "destructive" };
    case "completed":
      return { key: "completed", variant: "outline" };
    case "pending":
    default:
      return { key: "pending", variant: "secondary" };
  }
}

export function formatScheduleDate(locale: string, value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parsed);
}

export function formatScheduleWeekday(locale: string, value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(parsed);
}

/** Message key under `GuideDashboard.relativeDay`, plus the day count it needs. */
export type RelativeDay =
  | { key: "today" }
  | { key: "tomorrow" }
  | { key: "inDays"; days: number };

/** Days out from today, used to label a schedule day as Today / Tomorrow / in N days. */
export function relativeDayLabel(
  value: string,
  today: string
): RelativeDay | null {
  const target = new Date(`${value}T00:00:00`);
  const base = new Date(`${today}T00:00:00`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime())) return null;

  const days = Math.round(
    (target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days === 0) return { key: "today" };
  if (days === 1) return { key: "tomorrow" };
  if (days > 1 && days <= 14) return { key: "inDays", days };
  return null;
}
