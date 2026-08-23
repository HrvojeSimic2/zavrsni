import type { SupabaseClient, User } from "@supabase/supabase-js";

import { normalizeTime } from "@/lib/types/availability";

export type ConfirmedBooking = {
  id: string;
  date: string;
  partySize: number;
  startTime: string | null;
  endTime: string | null;
  durationHours: number | null;
  meetingPoint: string | null;
};

/**
 * Whether the signed-in user owns this guide profile.
 *
 * Deliberately matches on user_id rather than comparing emails: the guide's
 * email must not be fetched just to answer an ownership question, because
 * anything a server component reads ends up in the RSC payload.
 */
export async function isGuideOwner(
  supabase: SupabaseClient,
  user: User | null,
  guideId: string
): Promise<boolean> {
  if (!user) return false;

  const { data, error } = await supabase
    .from("guides")
    .select("id")
    .eq("id", guideId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[booking.access] failed to check guide ownership", error);
    return false;
  }
  return Boolean(data?.id);
}

export type GuideContact = { email: string | null; phone: string | null };

/**
 * Contact details, fetched only once the caller has established the viewer is
 * allowed to see them. Keeping this in its own query is the actual protection:
 * columns that are never selected cannot leak into the payload.
 */
export async function fetchGuideContact(
  supabase: SupabaseClient,
  guideId: string
): Promise<GuideContact> {
  const { data, error } = await supabase
    .from("guides")
    .select("email, phone")
    .eq("id", guideId)
    .maybeSingle();

  if (error) {
    console.warn("[booking.access] failed to load guide contact", error);
    return { email: null, phone: null };
  }

  return {
    email: (data?.email as string | null) ?? null,
    phone: (data?.phone as string | null) ?? null,
  };
}

/**
 * The traveller's next confirmed booking with a given guide, if any.
 *
 * This is the gate for contact details: a phone number is shared once the guide
 * has actually accepted the request, not merely because someone signed up.
 * Returns null for anonymous visitors and for pending or declined requests.
 *
 * Everything it needs now lives on the reservation itself — the time and the
 * meeting point belong to what these two agreed, not to a catalogue entry.
 */
export async function fetchConfirmedBookingWithGuide(
  supabase: SupabaseClient,
  user: User | null,
  guideId: string
): Promise<ConfirmedBooking | null> {
  if (!user) return null;

  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) return null;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, date, party_size, start_time, end_time, duration_hours, meeting_point"
    )
    .eq("guide_id", guideId)
    .ilike("customer_email", email)
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1);

  if (error) {
    console.warn("[booking.access] failed to check confirmed booking", error);
    return null;
  }

  const row = (data ?? [])[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  const startTime = normalizeTime(row.start_time) || null;
  const endTime = normalizeTime(row.end_time) || null;
  const durationHours =
    row.duration_hours === null || row.duration_hours === undefined
      ? null
      : Number(row.duration_hours);

  return {
    id: String(row.id),
    date: String(row.date),
    partySize: Math.max(Number(row.party_size ?? 1), 1),
    startTime,
    endTime,
    durationHours: Number.isFinite(durationHours) ? durationHours : null,
    meetingPoint: (row.meeting_point as string | null) ?? null,
  };
}
