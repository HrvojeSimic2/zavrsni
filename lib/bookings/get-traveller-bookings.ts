import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { ReservationStatus } from "@/lib/guide/guide-dashboard-data";

export type TravellerBooking = {
  id: string;
  date: string;
  partySize: number;
  status: ReservationStatus;
  totalAmount: number | null;
  currency: string;
  createdAt: string;
  tourId: string | null;
  tourTitle: string;
  meetingPoint: string | null;
  startTime: string | null;
  place: string;
  guideId: string | null;
  guideName: string;
};

export type TravellerBookings = {
  upcoming: TravellerBooking[];
  past: TravellerBooking[];
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toStatus(value: unknown): ReservationStatus {
  const statuses: ReservationStatus[] = [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ];
  return statuses.includes(value as ReservationStatus)
    ? (value as ReservationStatus)
    : "pending";
}

function formatPlace(location: unknown, country: unknown): string {
  return [location, country]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Every booking belonging to the signed-in traveller, split by whether it is
 * still ahead of them.
 *
 * Reservations carry no user_id, so the link is the email captured with the
 * booking; the RLS policy matches on the same column, which keeps this honest.
 */
export async function fetchTravellerBookings(
  supabase: SupabaseClient,
  user: User
): Promise<TravellerBookings> {
  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) return { upcoming: [], past: [] };

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, date, party_size, status, total_amount, currency, created_at, tour:tours ( id, title, meeting_point, start_time, location, country ), guide:guides ( id, name )"
    )
    .ilike("customer_email", email)
    .order("date", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("[bookings] failed to load traveller bookings", error);
    return { upcoming: [], past: [] };
  }

  const today = new Date().toISOString().slice(0, 10);

  const bookings: TravellerBooking[] = (
    (data ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const tour = firstRelation(
      row.tour as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const guide = firstRelation(
      row.guide as Record<string, unknown> | Record<string, unknown>[] | null
    );

    return {
      id: String(row.id),
      date: String(row.date),
      partySize: Math.max(Number(row.party_size ?? 1), 1),
      status: toStatus(row.status),
      totalAmount:
        row.total_amount === null || row.total_amount === undefined
          ? null
          : Number(row.total_amount),
      currency: String(row.currency ?? "EUR"),
      createdAt: String(row.created_at ?? ""),
      tourId: tour?.id ? String(tour.id) : null,
      tourTitle: String(tour?.title ?? "Tour"),
      meetingPoint: (tour?.meeting_point as string | null) ?? null,
      startTime: (tour?.start_time as string | null) ?? null,
      place: formatPlace(tour?.location, tour?.country),
      guideId: guide?.id ? String(guide.id) : null,
      guideName: String(guide?.name ?? "Guide"),
    };
  });

  // A cancelled booking is history even if its date has not arrived yet.
  const upcoming = bookings
    .filter(
      (booking) =>
        booking.date >= today &&
        booking.status !== "cancelled" &&
        booking.status !== "completed"
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = bookings.filter((booking) => !upcoming.includes(booking));

  return { upcoming, past };
}
