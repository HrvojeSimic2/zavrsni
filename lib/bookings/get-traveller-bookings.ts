import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { ReservationStatus } from "@/lib/guide/guide-dashboard-data";
import { normalizeTime } from "@/lib/types/availability";

export type TravellerBooking = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationHours: number | null;
  partySize: number;
  status: ReservationStatus;
  totalAmount: number | null;
  currency: string;
  createdAt: string;
  meetingPoint: string | null;
  requestNote: string | null;
  guideId: string | null;
  guideName: string;
  /** Where the guide works, for context on the card. */
  place: string;
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

/**
 * Every booking belonging to the signed-in traveller, split by whether it is
 * still ahead of them.
 *
 * A booking is time with a person: the guide is the relation, and the when and
 * where come from the reservation row itself.
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
      "id, date, start_time, end_time, duration_hours, party_size, status, total_amount, currency, created_at, meeting_point, request_note, guide:guides ( id, name, location )"
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
    const guide = firstRelation(
      row.guide as Record<string, unknown> | Record<string, unknown>[] | null
    );
    const duration =
      row.duration_hours === null || row.duration_hours === undefined
        ? null
        : Number(row.duration_hours);

    return {
      id: String(row.id),
      date: String(row.date),
      startTime: normalizeTime(row.start_time) || null,
      endTime: normalizeTime(row.end_time) || null,
      durationHours: Number.isFinite(duration) ? duration : null,
      partySize: Math.max(Number(row.party_size ?? 1), 1),
      status: toStatus(row.status),
      totalAmount:
        row.total_amount === null || row.total_amount === undefined
          ? null
          : Number(row.total_amount),
      currency: String(row.currency ?? "EUR"),
      createdAt: String(row.created_at ?? ""),
      meetingPoint: (row.meeting_point as string | null) ?? null,
      requestNote: (row.request_note as string | null) ?? null,
      guideId: guide?.id ? String(guide.id) : null,
      guideName: String(guide?.name ?? "Guide"),
      place: String(guide?.location ?? "").trim(),
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
