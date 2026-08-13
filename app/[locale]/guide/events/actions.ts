"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getGuideForUser } from "@/lib/guide/get-guide-for-user";

/** Guards against one submission generating a year of rows by accident. */
const MAX_DATES_PER_SUBMIT = 90;

const WEEKDAY_VALUES = ["0", "1", "2", "3", "4", "5", "6"] as const;

const addSchema = z.object({
  locale: z.string().min(2),
  tourId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  spots: z.coerce.number().int().min(1).max(100),
});

const removeSchema = z.object({
  locale: z.string().min(2),
  tourId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(locale: string, message: string): never {
  const query = new URLSearchParams();
  query.set("error", message);
  redirect(`/${locale}/guide/events?${query.toString()}`);
}

function redirectWithStatus(locale: string, message: string): never {
  const query = new URLSearchParams();
  query.set("status", message);
  redirect(`/${locale}/guide/events?${query.toString()}`);
}

function eachDate(startISO: string, endISO: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);

  while (cursor.getTime() <= end.getTime() && dates.length <= MAX_DATES_PER_SUBMIT) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

async function requireOwnedTour(
  locale: string,
  tourId: string
): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  guideId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const query = new URLSearchParams();
    query.set("next", `/${locale}/guide/events`);
    query.set("message", "Please sign in to continue.");
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);
  if (!guide || needsClaim) {
    redirectWithError(locale, "Claim your guide profile before managing dates.");
  }

  const { data: tour } = await supabase
    .from("tours")
    .select("id")
    .eq("id", tourId)
    .eq("guide_id", guide.id)
    .maybeSingle();

  if (!tour?.id) {
    redirectWithError(locale, "That tour does not belong to you.");
  }

  return { supabase, guideId: guide.id };
}

/**
 * Opens one date or a range of dates for booking.
 *
 * `spots` is the tour's total capacity for the day, not the leftover. Dates
 * that already carry bookings keep them: the stored value is capacity minus
 * what is already reserved, which is the same shape the booking flow and the
 * dashboard metrics expect.
 */
export async function addAvailabilityAction(formData: FormData) {
  const parsed = addSchema.safeParse({
    locale: getString(formData, "locale"),
    tourId: getString(formData, "tourId"),
    startDate: getString(formData, "startDate"),
    endDate: getString(formData, "endDate"),
    spots: getString(formData, "spots"),
  });

  if (!parsed.success) {
    const locale = getString(formData, "locale") || "en";
    redirectWithError(
      locale,
      parsed.error.issues[0]?.message ?? "Check the dates and number of spots."
    );
  }

  const { locale, tourId, startDate, spots } = parsed.data;
  const endDate = parsed.data.endDate || startDate;

  if (endDate < startDate) {
    redirectWithError(locale, "The end date cannot be before the start date.");
  }

  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today) {
    redirectWithError(locale, "Those dates are already in the past.");
  }

  const weekdays = new Set(
    formData
      .getAll("weekdays")
      .map((value) => String(value))
      .filter((value) => (WEEKDAY_VALUES as readonly string[]).includes(value))
  );

  const { supabase } = await requireOwnedTour(locale, tourId);

  const candidates = eachDate(startDate, endDate).filter((date) => {
    if (date < today) return false;
    if (weekdays.size === 0) return true;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return weekdays.has(String(weekday));
  });

  if (candidates.length === 0) {
    redirectWithError(locale, "No dates matched that range.");
  }
  if (candidates.length > MAX_DATES_PER_SUBMIT) {
    redirectWithError(
      locale,
      `That range covers more than ${MAX_DATES_PER_SUBMIT} dates. Split it up.`
    );
  }

  // Spots already taken on these dates must survive a capacity change.
  const { data: booked } = await supabase
    .from("reservations")
    .select("date, party_size, status")
    .eq("tour_id", tourId)
    .in("date", candidates)
    .in("status", ["pending", "confirmed"]);

  const bookedByDate = new Map<string, number>();
  for (const row of (booked ?? []) as Array<Record<string, unknown>>) {
    const date = String(row.date);
    const partySize = Number(row.party_size ?? 0);
    bookedByDate.set(date, (bookedByDate.get(date) ?? 0) + partySize);
  }

  const rows = candidates.map((date) => ({
    tour_id: tourId,
    date,
    available_spots: Math.max(spots - (bookedByDate.get(date) ?? 0), 0),
  }));

  const { error } = await supabase
    .from("tour_availability")
    .upsert(rows, { onConflict: "tour_id,date" });

  if (error) {
    console.warn("[guide.events] failed to upsert availability", error);
    if (error.code === "42501") {
      redirectWithError(
        locale,
        "Row-level security blocked this. Apply supabase/migrations/20260815090000_tour_availability_policies.sql."
      );
    }
    redirectWithError(locale, "Failed to save those dates.");
  }

  revalidatePath(`/${locale}/guide/events`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/tour/${tourId}`);

  redirectWithStatus(
    locale,
    `Opened ${rows.length} date${rows.length === 1 ? "" : "s"}.`
  );
}

/** Removes a date, unless travellers are already booked on it. */
export async function removeAvailabilityAction(formData: FormData) {
  const parsed = removeSchema.safeParse({
    locale: getString(formData, "locale"),
    tourId: getString(formData, "tourId"),
    date: getString(formData, "date"),
  });

  if (!parsed.success) {
    redirectWithError(getString(formData, "locale") || "en", "Invalid request.");
  }

  const { locale, tourId, date } = parsed.data;
  const { supabase } = await requireOwnedTour(locale, tourId);

  const { data: active } = await supabase
    .from("reservations")
    .select("id")
    .eq("tour_id", tourId)
    .eq("date", date)
    .in("status", ["pending", "confirmed"])
    .limit(1);

  if (active && active.length > 0) {
    redirectWithError(
      locale,
      "That date has active bookings. Decline them first if you cannot run it."
    );
  }

  const { error } = await supabase
    .from("tour_availability")
    .delete()
    .eq("tour_id", tourId)
    .eq("date", date);

  if (error) {
    console.warn("[guide.events] failed to delete availability", error);
    redirectWithError(locale, "Failed to remove that date.");
  }

  revalidatePath(`/${locale}/guide/events`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/tour/${tourId}`);

  redirectWithStatus(locale, "Date removed.");
}
