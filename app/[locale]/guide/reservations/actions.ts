"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGuideForUser } from "@/lib/guide/get-guide-for-user";

const schema = z.object({
  locale: z.string().min(2),
  reservationId: z.string().uuid(),
  status: z.enum(["confirmed", "cancelled"]),
});

/**
 * Confirms or declines a booking request. The traveller sees the outcome in
 * their notifications bar, so this is the only way a request leaves "pending".
 */
export async function updateReservationStatusAction(formData: FormData) {
  const parsed = schema.safeParse({
    locale: String(formData.get("locale") ?? ""),
    reservationId: String(formData.get("reservationId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    throw new Error("Invalid reservation update request.");
  }

  const { locale, reservationId, status } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const query = new URLSearchParams();
    query.set("next", `/${locale}/guide/reservations`);
    query.set("message", "Please sign in to continue.");
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);

  if (!guide || needsClaim) {
    throw new Error("Claim your guide profile before managing reservations.");
  }

  // Scoping every query by guide_id keeps a guide from touching another's
  // bookings even if the row id is guessed.
  const { data: reservation, error: loadError } = await supabase
    .from("reservations")
    .select("id, status, tour_id, date, party_size")
    .eq("id", reservationId)
    .eq("guide_id", guide.id)
    .maybeSingle();

  if (loadError || !reservation) {
    console.warn("[guide.reservations] reservation not found", loadError);
    throw new Error("Reservation not found.");
  }

  const previousStatus = String(reservation.status ?? "pending");
  if (previousStatus === status) return;

  const { error: updateError } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId)
    .eq("guide_id", guide.id);

  if (updateError) {
    console.warn("[guide.reservations] failed to update status", updateError);
    throw new Error("Failed to update the reservation.");
  }

  // Booking a tour holds spots up front, so declining has to hand them back or
  // the date silently loses capacity. Only statuses that were still holding
  // spots qualify, which keeps a second decline click from inflating them.
  const wasHoldingSpots =
    previousStatus === "pending" || previousStatus === "confirmed";

  if (status === "cancelled" && wasHoldingSpots && reservation.tour_id) {
    const partySize = Math.max(Number(reservation.party_size ?? 0), 0);

    if (partySize > 0) {
      // tour_availability has no guide-facing update policy, so this runs with
      // the admin client after the ownership check above.
      const admin = createAdminClient();
      const { data: availability } = await admin
        .from("tour_availability")
        .select("available_spots")
        .eq("tour_id", reservation.tour_id)
        .eq("date", reservation.date)
        .maybeSingle();

      if (availability) {
        const restored = Number(availability.available_spots ?? 0) + partySize;
        const { error: restoreError } = await admin
          .from("tour_availability")
          .update({ available_spots: restored })
          .eq("tour_id", reservation.tour_id)
          .eq("date", reservation.date);

        if (restoreError) {
          console.warn(
            "[guide.reservations] failed to return spots after decline",
            restoreError
          );
        }
      }
    }
  }

  revalidatePath(`/${locale}/guide/reservations`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/guide/events`);
  if (reservation.tour_id) {
    revalidatePath(`/${locale}/tour/${reservation.tour_id}`);
  }
}
