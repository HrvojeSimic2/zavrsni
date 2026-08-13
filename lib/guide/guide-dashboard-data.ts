import type { SupabaseClient } from "@supabase/supabase-js";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type GuideTour = {
  id: string;
  title: string;
  price: number | null;
  category: string | null;
  location: string | null;
  rating: number | null;
  reviewCount: number;
};

export type GuideEvent = {
  tourId: string;
  tourTitle: string;
  date: string;
  availableSpots: number;
};

export type GuideReservation = {
  id: string;
  tourId: string | null;
  tourTitle: string;
  date: string;
  partySize: number;
  status: ReservationStatus;
  customerName: string | null;
  totalAmount: number | null;
  currency: string | null;
  createdAt: string;
};

export type GuideMetrics = {
  tourCount: number;
  upcomingEventCount: number;
  upcomingSpots: number;
  upcomingReservationCount: number;
  upcomingGuests: number;
  pendingReservationCount: number;
  bookedGuestsNext30: number;
  fillRate: number | null;
  upcomingRevenue: number;
  revenueLast30: number;
  reservationsLast30: number;
  cancellationRate: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
};

export type GuideDashboardData = {
  tours: GuideTour[];
  upcomingEvents: GuideEvent[];
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

/**
 * PostgREST returns an embedded relation as an object or as a single-element
 * array depending on how it infers the relationship, so normalize both.
 */
function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

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
 * Revenue for a single reservation. `total_amount` is authoritative when the
 * booking recorded one; otherwise fall back to the tour's list price.
 */
function reservationRevenue(
  reservation: GuideReservation,
  priceByTourId: Map<string, number>
): number {
  if (reservation.totalAmount !== null) return reservation.totalAmount;
  const price = reservation.tourId
    ? priceByTourId.get(reservation.tourId) ?? 0
    : 0;
  return price * Math.max(reservation.partySize, 1);
}

function countsTowardRevenue(status: ReservationStatus): boolean {
  return status === "confirmed" || status === "completed";
}

/**
 * Loads everything the guide dashboard needs in one pass: tours, upcoming
 * availability, reservations on both sides of today, and the derived metrics.
 *
 * Query failures are logged and degrade to empty data rather than throwing, so
 * a missing table (for example before migrations are applied) still renders a
 * usable dashboard.
 */
export async function fetchGuideDashboardData(
  supabase: SupabaseClient,
  guideId: string,
  options?: { windowDays?: number; eventLimit?: number; reservationLimit?: number }
): Promise<GuideDashboardData> {
  const windowDays = Math.max(1, Math.min(options?.windowDays ?? 30, 365));
  const eventLimit = options?.eventLimit ?? 200;
  const reservationLimit = options?.reservationLimit ?? 200;

  const now = new Date();
  const today = toISODate(now);
  const windowEnd = toISODate(addDays(now, windowDays));
  const windowStart = toISODate(addDays(now, -windowDays));

  const { data: tourRows, error: toursError } = await supabase
    .from("tours")
    .select("id, title, price, category, location, rating, review_count")
    .eq("guide_id", guideId)
    .order("title", { ascending: true });

  if (toursError) {
    console.warn("[guide.dashboard] failed to load tours", toursError);
  }

  const tours: GuideTour[] = (
    (tourRows ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? "Tour"),
    price: row.price === null || row.price === undefined ? null : toNumber(row.price),
    category: (row.category as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    rating: row.rating === null || row.rating === undefined ? null : toNumber(row.rating),
    reviewCount: toNumber(row.review_count),
  }));

  const tourIds = tours.map((tour) => tour.id);

  const availabilityQuery = tourIds.length
    ? supabase
        .from("tour_availability")
        .select("tour_id, date, available_spots, tour:tours ( id, title )")
        .in("tour_id", tourIds)
        .gte("date", today)
        .lte("date", windowEnd)
        .order("date", { ascending: true })
        .limit(eventLimit)
    : null;

  const [
    { data: availabilityRows, error: availabilityError },
    { data: reservationRows, error: reservationsError },
  ] = await Promise.all([
    availabilityQuery ?? Promise.resolve({ data: [], error: null }),
    supabase
      .from("reservations")
      .select(
        "id, tour_id, date, party_size, status, customer_name, total_amount, currency, created_at, tour:tours ( id, title )"
      )
      .eq("guide_id", guideId)
      .gte("date", windowStart)
      .lte("date", windowEnd)
      .order("date", { ascending: true })
      .limit(reservationLimit),
  ]);

  if (availabilityError) {
    console.warn("[guide.dashboard] failed to load availability", availabilityError);
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

  const titleByTourId = new Map(tours.map((tour) => [tour.id, tour.title]));
  const priceByTourId = new Map(
    tours.map((tour) => [tour.id, tour.price ?? 0] as const)
  );

  const upcomingEvents: GuideEvent[] = (
    (availabilityRows ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const tour = firstRelation(
      row.tour as { id: string; title: string } | { id: string; title: string }[] | null
    );
    const tourId = String(row.tour_id);
    return {
      tourId,
      tourTitle: tour?.title ?? titleByTourId.get(tourId) ?? "Tour",
      date: String(row.date),
      availableSpots: toNumber(row.available_spots),
    };
  });

  const allReservations: GuideReservation[] = (
    (reservationRows ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const tour = firstRelation(
      row.tour as { id: string; title: string } | { id: string; title: string }[] | null
    );
    const tourId = row.tour_id ? String(row.tour_id) : null;
    return {
      id: String(row.id),
      tourId,
      tourTitle:
        tour?.title ?? (tourId ? titleByTourId.get(tourId) : null) ?? "Tour",
      date: String(row.date),
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

  const upcomingReservations = allReservations
    .filter((reservation) => reservation.date >= today)
    .filter((reservation) => reservation.status !== "cancelled");

  const recentReservations = allReservations
    .filter((reservation) => reservation.date < today)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const activeUpcoming = upcomingReservations.filter((reservation) =>
    countsTowardRevenue(reservation.status)
  );

  const upcomingGuests = upcomingReservations.reduce(
    (sum, reservation) => sum + reservation.partySize,
    0
  );

  const bookedGuestsNext30 = activeUpcoming.reduce(
    (sum, reservation) => sum + reservation.partySize,
    0
  );

  const upcomingSpots = upcomingEvents.reduce(
    (sum, event) => sum + event.availableSpots,
    0
  );

  const upcomingRevenue = activeUpcoming.reduce(
    (sum, reservation) => sum + reservationRevenue(reservation, priceByTourId),
    0
  );

  const revenueLast30 = recentReservations
    .filter((reservation) => countsTowardRevenue(reservation.status))
    .reduce(
      (sum, reservation) => sum + reservationRevenue(reservation, priceByTourId),
      0
    );

  const cancelledCount = allReservations.filter(
    (reservation) => reservation.status === "cancelled"
  ).length;

  // Remaining spots plus already-booked guests approximates total capacity in
  // the window, so this reads as "share of capacity that is sold".
  const capacityNext30 = upcomingSpots + bookedGuestsNext30;

  const reviewCount = tours.reduce((sum, tour) => sum + tour.reviewCount, 0);
  const ratingNumerator = tours.reduce(
    (sum, tour) => sum + (tour.rating ?? 0) * tour.reviewCount,
    0
  );
  const ratedTours = tours.filter((tour) => (tour.rating ?? 0) > 0);
  const rating =
    reviewCount > 0
      ? ratingNumerator / reviewCount
      : ratedTours.length > 0
        ? ratedTours.reduce((sum, tour) => sum + (tour.rating ?? 0), 0) /
          ratedTours.length
        : 0;

  const currency =
    allReservations.find((reservation) => reservation.currency)?.currency ?? "EUR";

  const metrics: GuideMetrics = {
    tourCount: tours.length,
    upcomingEventCount: upcomingEvents.length,
    upcomingSpots,
    upcomingReservationCount: upcomingReservations.length,
    upcomingGuests,
    pendingReservationCount: upcomingReservations.filter(
      (reservation) => reservation.status === "pending"
    ).length,
    bookedGuestsNext30,
    fillRate: capacityNext30 > 0 ? bookedGuestsNext30 / capacityNext30 : null,
    upcomingRevenue,
    revenueLast30,
    reservationsLast30: recentReservations.length,
    cancellationRate:
      allReservations.length > 0 ? cancelledCount / allReservations.length : null,
    currency,
    rating: Number(rating.toFixed(2)),
    reviewCount,
  };

  return {
    tours,
    upcomingEvents,
    upcomingReservations,
    recentReservations,
    metrics,
  };
}
