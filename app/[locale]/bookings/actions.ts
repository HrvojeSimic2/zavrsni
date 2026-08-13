"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  locale: z.string().min(2),
  reservationId: z.string().uuid(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWith(locale: string, key: "status" | "error", value: string): never {
  const query = new URLSearchParams();
  query.set(key, value);
  redirect(`/${locale}/bookings?${query.toString()}`);
}

/**
 * Cancels the traveller's own booking and returns the held spots.
 *
 * Travellers have no update policy on reservations — reading their own row is
 * all RLS grants them — so the write runs with the admin client after the
 * ownership check below. The reservation is matched on the booking email, the
 * same link the rest of the traveller flow uses.
 */
export async function cancelBookingAction(formData: FormData) {
  const parsed = schema.safeParse({
    locale: getString(formData, "locale"),
    reservationId: getString(formData, "reservationId"),
  });

  if (!parsed.success) {
    redirectWith(getString(formData, "locale") || "en", "error", "invalid");
  }

  const { locale, reservationId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const query = new URLSearchParams();
    query.set("next", `/${locale}/bookings`);
    query.set("message", "Please sign in to continue.");
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) redirectWith(locale, "error", "invalid");

  const admin = createAdminClient();

  const { data: reservation, error: loadError } = await admin
    .from("reservations")
    .select("id, status, date, tour_id, party_size, customer_email")
    .eq("id", reservationId)
    .maybeSingle();

  if (loadError || !reservation) {
    redirectWith(locale, "error", "notFound");
  }

  // The ownership check that RLS would otherwise do for us.
  if (
    String(reservation.customer_email ?? "").trim().toLowerCase() !== email
  ) {
    redirectWith(locale, "error", "notYours");
  }

  const status = String(reservation.status ?? "pending");
  if (status === "cancelled") {
    redirectWith(locale, "status", "alreadyCancelled");
  }
  if (status === "completed") {
    redirectWith(locale, "error", "alreadyDone");
  }

  // Date-only granularity: the day of the tour is already too late to drop out.
  const today = new Date().toISOString().slice(0, 10);
  if (String(reservation.date) <= today) {
    redirectWith(locale, "error", "tooLate");
  }

  const { error: updateError } = await admin
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);

  if (updateError) {
    console.warn("[bookings] failed to cancel reservation", updateError);
    redirectWith(locale, "error", "failed");
  }

  // Hand the spots back, exactly as declining does on the guide side.
  const partySize = Math.max(Number(reservation.party_size ?? 0), 0);
  if (partySize > 0 && reservation.tour_id) {
    const { data: availability } = await admin
      .from("tour_availability")
      .select("available_spots")
      .eq("tour_id", reservation.tour_id)
      .eq("date", reservation.date)
      .maybeSingle();

    if (availability) {
      const { error: restoreError } = await admin
        .from("tour_availability")
        .update({
          available_spots: Number(availability.available_spots ?? 0) + partySize,
        })
        .eq("tour_id", reservation.tour_id)
        .eq("date", reservation.date);

      if (restoreError) {
        console.warn("[bookings] failed to return spots", restoreError);
      }
    }
  }

  revalidatePath(`/${locale}/bookings`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/reservations`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/guide/events`);
  if (reservation.tour_id) {
    revalidatePath(`/${locale}/tour/${reservation.tour_id}`);
  }

  redirectWith(locale, "status", "cancelled");
}
