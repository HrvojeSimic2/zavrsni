import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeTime, slotDurationHours } from "@/lib/types/availability";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

/** One block of the guide's opened time. Was `GuideEvent` over a tour date. */
export type GuideSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  note: string | null;
  booked: boolean;
};

export type GuideReservation = {
  id: string;
  slotId: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationHours: number | null;
  partySize: number;
  status: ReservationStatus;
  customerName: string | null;
  totalAmount: number | null;
  currency: string | null;
  createdAt: string;
};

export type GuideMetrics = {
  openSlotCount: number;
  bookedSlotCount: number;
  /** Hours of open time still on the calendar in the window. */
  openHours: number;
  upcomingReservationCount: number;
  upcomingGuests: number;
  pendingReservationCount: number;
  /** Share of the time the guide opened that someone has taken. */
  fillRate: number | null;
  upcomingRevenue: number;
  revenueLast30: number;
  reservationsLast30: number;
  cancellationRate: number | null;
  currency: string;
  hourlyRate: number | null;
  rating: number;
  reviewCount: number;
};

export type GuideDashboardData = {
  upcomingSlots: GuideSlot[];
  upcomingReservations: GuideReservation[];
  recentReservations: GuideReservation[];
  metrics: GuideMetrics;
};

const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

const HOLDING_STATUSES = ["pending", "confirmed"];

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStatus(value: unknown): ReservationStatus {
  return RESERVATION_STATUSES.includes(value as ReservationStatus)
    ? (value as ReservationStatus)
    : "pending";
}

/**
 * Revenue for a single reservation.
 *
 * `total_amount` is the only source: it was computed from the rate at the time
 * of booking, so a later rate change cannot rewrite history. A null means the
 * guide had published no rate and the price is still to be agreed — counting
 * that as anything but zero would invent revenue.
 */
function reservationRevenue(reservation: GuideReservation): number {
  return reservation.totalAmount ?? 0;
}

function countsTowardRevenue(status: ReservationStatus): boolean {
  return status === "confirmed" || status === "completed";
}

/**
 * Loads everything the guide dashboard needs in one pass: the slots they have
 * opened, reservations on both sides of today, and the derived metrics.
 *
 * Query failures are logged and degrade to empty data rather than throwing, so
 * a missing table (for example before migrations are applied) still renders a
 * usable dashboard.
 */
export async function fetchGuideDashboardData(
  supabase: SupabaseClient,
  guideId: string,
  options?: { windowDays?: number; slotLimit?: number; reservationLimit?: number }
): Promise<GuideDashboardData> {
  const windowDays = Math.max(1, Math.min(options?.windowDays ?? 30, 365));
  const slotLimit = options?.slotLimit ?? 200;
  const reservationLimit = options?.reservationLimit ?? 200;

  const now = new Date();
  const today = toISODate(now);
  const windowEnd = toISODate(addDays(now, windowDays));
  const windowStart = toISODate(addDays(now, -windowDays));

  const [
    { data: guideRow, error: guideError },
    { data: slotRows, error: slotsError },
    { data: reservationRows, error: reservationsError },
  ] = await Promise.all([
    supabase
      .from("guides")
      .select("hourly_rate, rating, review_count")
      .eq("id", guideId)
      .maybeSingle(),
    supabase
      .from("guide_availability")
      .select("id, date, start_time, end_time, note")
      .eq("guide_id", guideId)
      .gte("date", today)
      .lte("date", windowEnd)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(slotLimit),
    supabase
      .from("reservations")
      .select(
        "id, availability_id, date, start_time, end_time, duration_hours, party_size, status, customer_name, total_amount, currency, created_at"
      )
      .eq("guide_id", guideId)
      .gte("date", windowStart)
      .lte("date", windowEnd)
      .order("date", { ascending: true })
      .limit(reservationLimit),
  ]);

  if (guideError) {
    console.warn("[guide.dashboard] failed to load guide", guideError);
  }
  if (slotsError) {
    console.warn("[guide.dashboard] failed to load slots", slotsError);
  }
  if (reservationsError) {
    if ((reservationsError as { code?: string } | null)?.code === "PGRST205") {
      console.warn(
        "[guide.dashboard] missing public.reservations table. Did you run the Supabase migrations? Try `npm run supabase:reset` (local) or `npm run supabase:push` (hosted).",
        reservationsError
      );
    } else {
      console.warn("[guide.dashboard] failed to load reservations", reservationsError);
    }
  }

  const allReservations: GuideReservation[] = (
    (reservationRows ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const startTime = normalizeTime(row.start_time) || null;
    const endTime = normalizeTime(row.end_time) || null;
    const duration =
      row.duration_hours === null || row.duration_hours === undefined
        ? startTime && endTime
          ? slotDurationHours(startTime, endTime)
          : null
        : toNumber(row.duration_hours);

    return {
      id: String(row.id),
      slotId: row.availability_id ? String(row.availability_id) : null,
      date: String(row.date),
      startTime,
      endTime,
      durationHours: duration,
      partySize: Math.max(toNumber(row.party_size, 1), 1),
      status: toStatus(row.status),
      customerName: (row.customer_name as string | null) ?? null,
      totalAmount:
        row.total_amount === null || row.total_amount === undefined
          ? null
          : toNumber(row.total_amount),
      currency: (row.currency as string | null) ?? null,
      createdAt: String(row.created_at ?? ""),
    };
  });

  // A slot counts as taken while a live request sits on it.
  const heldSlotIds = new Set(
    allReservations
      .filter((reservation) => HOLDING_STATUSES.includes(reservation.status))
      .map((reservation) => reservation.slotId)
      .filter((id): id is string => Boolean(id))
  );

  const upcomingSlots: GuideSlot[] = (
    (slotRows ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const startTime = normalizeTime(row.start_time);
    const endTime = normalizeTime(row.end_time);
    return {
      id: String(row.id),
      date: String(row.date),
      startTime,
      endTime,
      durationHours: slotDurationHours(startTime, endTime),
      note: (row.note as string | null) ?? null,
      booked: heldSlotIds.has(String(row.id)),
    };
  });

  const upcomingReservations = allReservations
    .filter((reservation) => reservation.date >= today)
    .filter((reservation) => reservation.status !== "cancelled");

  const recentReservations = allReservations
    .filter((reservation) => reservation.date < today)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const activeUpcoming = upcomingReservations.filter((reservation) =>
    countsTowardRevenue(reservation.status)
  );

  const openSlots = upcomingSlots.filter((slot) => !slot.booked);
  const bookedSlots = upcomingSlots.filter((slot) => slot.booked);

  const openHours = openSlots.reduce((sum, slot) => sum + slot.durationHours, 0);

  const upcomingGuests = upcomingReservations.reduce(
    (sum, reservation) => sum + reservation.partySize,
    0
  );

  const upcomingRevenue = activeUpcoming.reduce(
    (sum, reservation) => sum + reservationRevenue(reservation),
    0
  );

  const revenueLast30 = recentReservations
    .filter((reservation) => countsTowardRevenue(reservation.status))
    .reduce((sum, reservation) => sum + reservationRevenue(reservation), 0);

  const cancelledCount = allReservations.filter(
    (reservation) => reservation.status === "cancelled"
  ).length;

  // "How much of the time I opened is taken" — a ratio of slots, which is what
  // the guide actually controls. The old version divided guests by leftover
  // seats, which only meant something for a fixed-capacity tour.
  const totalSlots = upcomingSlots.length;

  const currency =
    allReservations.find((reservation) => reservation.currency)?.currency ?? "EUR";

  const rawRate = (guideRow as { hourly_rate?: number | null } | null)?.hourly_rate;
  const hourlyRate =
    rawRate === null || rawRate === undefined || toNumber(rawRate) <= 0
      ? null
      : toNumber(rawRate);

  const metrics: GuideMetrics = {
    openSlotCount: openSlots.length,
    bookedSlotCount: bookedSlots.length,
    openHours,
    upcomingReservationCount: upcomingReservations.length,
    upcomingGuests,
    pendingReservationCount: upcomingReservations.filter(
      (reservation) => reservation.status === "pending"
    ).length,
    fillRate: totalSlots > 0 ? bookedSlots.length / totalSlots : null,
    upcomingRevenue,
    revenueLast30,
    reservationsLast30: recentReservations.length,
    cancellationRate:
      allReservations.length > 0 ? cancelledCount / allReservations.length : null,
    currency,
    hourlyRate,
    rating: Number(
      ((guideRow as { rating?: number | null } | null)?.rating ?? 0)
    ),
    reviewCount: Number(
      ((guideRow as { review_count?: number | null } | null)?.review_count ?? 0)
    ),
  };

  return {
    upcomingSlots,
    upcomingReservations,
    recentReservations,
    metrics,
  };
}
