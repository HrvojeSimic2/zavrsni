"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getGuideForUser } from "@/lib/guide/get-guide-for-user";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";
import { GuideFlashError } from "@/lib/i18n/guide-flash";

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
    throw new Error(GuideFlashError.InvalidReservationUpdate);
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
    query.set("message", AuthFlashMessage.SignInToContinue);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);

  if (!guide || needsClaim) {
    throw new Error(GuideFlashError.ClaimBeforeReservations);
  }

  // Scoping every query by guide_id keeps a guide from touching another's
  // bookings even if the row id is guessed.
  const { data: reservation, error: loadError } = await supabase
    .from("reservations")
    .select("id, status, availability_id, date, party_size")
    .eq("id", reservationId)
    .eq("guide_id", guide.id)
    .maybeSingle();

  if (loadError || !reservation) {
    console.warn("[guide.reservations] reservation not found", loadError);
    throw new Error(GuideFlashError.ReservationNotFound);
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
    throw new Error(GuideFlashError.ReservationUpdateFailed);
  }

  // Declining releases the slot on its own: a slot counts as taken only while
  // a pending or confirmed request points at it, and the partial unique index
  // that guards double-booking is scoped to those same statuses. There is no
  // capacity number to hand back any more.

  revalidatePath(`/${locale}/guide/reservations`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/guide/events`);
  revalidatePath(`/${locale}/guides/${guide.id}`);
}
