"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";

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
    query.set("message", AuthFlashMessage.SignInToContinue);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const email = String(user.email ?? "").trim().toLowerCase();
  if (!email) redirectWith(locale, "error", "invalid");

  const admin = createAdminClient();

  const { data: reservation, error: loadError } = await admin
    .from("reservations")
    .select("id, status, date, guide_id, availability_id, party_size, customer_email")
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

  // Date-only granularity: the day itself is already too late to drop out.
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

  // Cancelling frees the slot by itself — it is held only while the request is
  // pending or confirmed. Nothing to restore.

  revalidatePath(`/${locale}/bookings`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/reservations`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/guide/events`);
  if (reservation.guide_id) {
    revalidatePath(`/${locale}/guides/${reservation.guide_id}`);
  }

  redirectWith(locale, "status", "cancelled");
}
