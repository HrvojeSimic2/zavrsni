import type { ReservationStatus } from "@/lib/guide/guide-dashboard-data";

export { formatMoney, DEFAULT_CURRENCY } from "@/lib/format/money";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function reservationBadge(status: ReservationStatus | null | undefined): {
  text: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case "confirmed":
      return { text: "Confirmed", variant: "default" };
    case "cancelled":
      return { text: "Cancelled", variant: "destructive" };
    case "completed":
      return { text: "Completed", variant: "outline" };
    case "pending":
    default:
      return { text: "Pending", variant: "secondary" };
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


/** Days out from today, used to label a schedule day as Today / Tomorrow / in N days. */
export function relativeDayLabel(value: string, today: string): string | null {
  const target = new Date(`${value}T00:00:00`);
  const base = new Date(`${today}T00:00:00`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime())) return null;

  const days = Math.round(
    (target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days <= 14) return `In ${days} days`;
  return null;
}
