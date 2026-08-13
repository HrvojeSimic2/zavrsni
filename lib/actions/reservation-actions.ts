"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateReservationResult =
  | { ok: true; reservationId: string }
  | { ok: false; code: ReservationErrorCode };

export type ReservationErrorCode =
  | "SIGN_IN_REQUIRED"
  | "INVALID_INPUT"
  | "TOUR_NOT_FOUND"
  | "NOT_OFFERED"
  | "NOT_ENOUGH_SPOTS"
  | "ALREADY_BOOKED"
  | "FAILED";

const schema = z.object({
  tourId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(50),
  locale: z.string().min(2).max(5),
});

const CURRENCY = "EUR";

function fail(code: ReservationErrorCode): CreateReservationResult {
  return { ok: false, code };
}

/**
 * Creates a booking request for a tour date.
 *
 * Runs the write with the admin client on purpose: travellers must not be able
 * to write reservations or edit availability directly, so every field is
 * derived server-side and only tourId/date/guests come from the caller. The
 * request lands as `pending` and shows up in the guide's notifications bar.
 */
export async function createReservationAction(input: {
  tourId: string;
  date: string;
  guests: number;
  locale: string;
}): Promise<CreateReservationResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");

  const { tourId, date, guests, locale } = parsed.data;

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return fail("INVALID_INPUT");

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return fail("SIGN_IN_REQUIRED");

  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) return fail("SIGN_IN_REQUIRED");

  const admin = createAdminClient();

  const { data: tour, error: tourError } = await admin
    .from("tours")
    .select("id, title, price, guide_id")
    .eq("id", tourId)
    .maybeSingle();

  if (tourError || !tour?.guide_id) return fail("TOUR_NOT_FOUND");

  const { data: availability, error: availabilityError } = await admin
    .from("tour_availability")
    .select("tour_id, date, available_spots")
    .eq("tour_id", tourId)
    .eq("date", date)
    .maybeSingle();

  if (availabilityError) {
    console.warn("[reservation] failed to read availability", availabilityError);
    return fail("FAILED");
  }
  if (!availability) return fail("NOT_OFFERED");

  const spots = Number(availability.available_spots ?? 0);
  if (spots < guests) return fail("NOT_ENOUGH_SPOTS");

  // One open request per traveller per date keeps a double-submit from
  // consuming the same spots twice.
  const { data: existing } = await admin
    .from("reservations")
    .select("id")
    .eq("tour_id", tourId)
    .eq("date", date)
    .ilike("customer_email", email)
    .in("status", ["pending", "confirmed"])
    .limit(1);

  if (existing && existing.length > 0) return fail("ALREADY_BOOKED");

  // Hold the spots first, guarded on the value we just read, so two concurrent
  // bookings cannot both pass the check above.
  const { data: held, error: holdError } = await admin
    .from("tour_availability")
    .update({ available_spots: spots - guests })
    .eq("tour_id", tourId)
    .eq("date", date)
    .eq("available_spots", spots)
    .select("tour_id");

  if (holdError) {
    console.warn("[reservation] failed to hold spots", holdError);
    return fail("FAILED");
  }
  if (!held || held.length === 0) return fail("NOT_ENOUGH_SPOTS");

  const price = Number(tour.price ?? 0);
  const customerName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split("@")[0];

  const { data: inserted, error: insertError } = await admin
    .from("reservations")
    .insert({
      guide_id: tour.guide_id,
      tour_id: tourId,
      date,
      party_size: guests,
      status: "pending",
      customer_name: customerName,
      customer_email: email,
      total_amount: Number((price * guests).toFixed(2)),
      currency: CURRENCY,
    })
    .select("id")
    .maybeSingle();

  if (insertError || !inserted?.id) {
    console.warn("[reservation] failed to insert reservation", insertError);
    // Give the held spots back so a failed insert doesn't shrink availability.
    await admin
      .from("tour_availability")
      .update({ available_spots: spots })
      .eq("tour_id", tourId)
      .eq("date", date);
    return fail("FAILED");
  }

  revalidatePath(`/${locale}/tour/${tourId}`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/reservations`);
  revalidatePath(`/${locale}/guide/schedule`);

  return { ok: true, reservationId: inserted.id };
}
