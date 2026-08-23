"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTime, slotDurationHours } from "@/lib/types/availability";
import { toSpecialties } from "@/lib/types/specialty";

export type BookingErrorCode =
  | "SIGN_IN_REQUIRED"
  | "INVALID_INPUT"
  | "SLOT_NOT_FOUND"
  | "SLOT_IN_PAST"
  | "SLOT_TAKEN"
  | "GROUP_TOO_LARGE"
  | "OWN_PROFILE"
  | "FAILED";

export type CreateBookingResult =
  | {
      ok: true;
      reservationId: string;
      guideId: string;
      totalAmount: number | null;
    }
  | { ok: false; code: BookingErrorCode };

const schema = z.object({
  slotId: z.string().uuid(),
  guests: z.number().int().min(1).max(100),
  note: z.string().max(600).optional(),
  interests: z.array(z.string()).max(5).optional(),
  locale: z.string().min(2).max(5),
});

const CURRENCY = "EUR";

/** Postgres unique-violation: the slot was taken between our read and insert. */
const UNIQUE_VIOLATION = "23505";

function fail(code: BookingErrorCode): CreateBookingResult {
  return { ok: false, code };
}

/**
 * Requests a guide for one of their open slots.
 *
 * The unit is the slot, not a product: the traveller picks a block of the
 * guide's time and the price is the guide's hourly rate times that block. Party
 * size is checked against the guide's cap but does not multiply the price —
 * you are hiring a person, not buying seats.
 *
 * Runs the write with the admin client on purpose: travellers must not be able
 * to write reservations directly, so only slotId, guests and the note come from
 * the caller and everything charged is derived server-side.
 *
 * Concurrency is handled by `reservations_one_active_per_slot`, a partial
 * unique index on (availability_id) for live statuses. The insert *is* the
 * lock, so there is no read-then-hold dance and nothing to compensate if it
 * fails.
 */
export async function createGuideBookingAction(input: {
  slotId: string;
  guests: number;
  note?: string;
  interests?: string[];
  locale: string;
}): Promise<CreateBookingResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");

  const { slotId, guests, locale } = parsed.data;
  const note = parsed.data.note?.trim() || null;
  const interests = toSpecialties(parsed.data.interests);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return fail("SIGN_IN_REQUIRED");

  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) return fail("SIGN_IN_REQUIRED");

  const admin = createAdminClient();

  const { data: slot, error: slotError } = await admin
    .from("guide_availability")
    .select("id, guide_id, date, start_time, end_time, note")
    .eq("id", slotId)
    .maybeSingle();

  if (slotError) {
    console.warn("[booking] failed to read slot", slotError);
    return fail("FAILED");
  }
  if (!slot?.guide_id) return fail("SLOT_NOT_FOUND");

  const today = new Date().toISOString().slice(0, 10);
  if (String(slot.date) < today) return fail("SLOT_IN_PAST");

  const { data: guide, error: guideError } = await admin
    .from("guides")
    .select("id, name, user_id, hourly_rate, max_group_size, default_meeting_point")
    .eq("id", slot.guide_id)
    .maybeSingle();

  if (guideError || !guide?.id) {
    console.warn("[booking] failed to read guide", guideError);
    return fail("SLOT_NOT_FOUND");
  }

  // A guide requesting their own time is a mistake, not a booking.
  if (guide.user_id && guide.user_id === user.id) return fail("OWN_PROFILE");

  const maxGroupSize = Number(guide.max_group_size ?? 6);
  if (Number.isFinite(maxGroupSize) && guests > maxGroupSize) {
    return fail("GROUP_TOO_LARGE");
  }

  const startTime = normalizeTime(slot.start_time);
  const endTime = normalizeTime(slot.end_time);
  const durationHours = slotDurationHours(startTime, endTime);

  const hourlyRate = Number(guide.hourly_rate ?? 0) > 0
    ? Number(guide.hourly_rate)
    : null;

  // No published rate means the price is still to be agreed; recording a zero
  // would read as "free" on the traveller's bookings page.
  const totalAmount =
    hourlyRate !== null && durationHours > 0
      ? Number((hourlyRate * durationHours).toFixed(2))
      : null;

  const customerName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split("@")[0];

  const { data: inserted, error: insertError } = await admin
    .from("reservations")
    .insert({
      guide_id: guide.id,
      availability_id: slotId,
      date: slot.date,
      start_time: startTime,
      end_time: endTime,
      duration_hours: durationHours,
      hourly_rate: hourlyRate,
      party_size: guests,
      status: "pending",
      customer_name: customerName,
      customer_email: email,
      total_amount: totalAmount,
      currency: CURRENCY,
      meeting_point: guide.default_meeting_point ?? null,
      interests: interests.length > 0 ? interests : null,
      note,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    if ((insertError as { code?: string }).code === UNIQUE_VIOLATION) {
      return fail("SLOT_TAKEN");
    }
    console.warn("[booking] failed to insert reservation", insertError);
    return fail("FAILED");
  }
  if (!inserted?.id) return fail("FAILED");

  revalidatePath(`/${locale}/guides/${guide.id}`);
  revalidatePath(`/${locale}/bookings`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/reservations`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/guide/events`);

  return {
    ok: true,
    reservationId: inserted.id,
    guideId: guide.id,
    totalAmount,
  };
}
