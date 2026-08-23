"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getGuideForUser } from "@/lib/guide/get-guide-for-user";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";
import { GuideFlashError, GuideFlashStatus } from "@/lib/i18n/guide-flash";

/** Guards against one submission generating a year of slots by accident. */
const MAX_DATES_PER_SUBMIT = 90;

const WEEKDAY_VALUES = ["0", "1", "2", "3", "4", "5", "6"] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const addSchema = z.object({
  locale: z.string().min(2),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  startTime: z.string().regex(TIME_PATTERN),
  endTime: z.string().regex(TIME_PATTERN),
  note: z.string().max(120).optional(),
});

const removeSchema = z.object({
  locale: z.string().min(2),
  slotId: z.string().uuid(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** `count` fills the `{n}` placeholder of the keys that need one. */
function redirectWithError(locale: string, key: string, count?: number): never {
  const query = new URLSearchParams();
  query.set("error", key);
  if (count !== undefined) query.set("n", String(count));
  redirect(`/${locale}/guide/events?${query.toString()}`);
}

function redirectWithStatus(locale: string, key: string, count?: number): never {
  const query = new URLSearchParams();
  query.set("status", key);
  if (count !== undefined) query.set("n", String(count));
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

/**
 * The guide's own profile, or a redirect. Ownership is the whole check now:
 * slots hang off the guide, so there is no product to verify first.
 */
async function requireOwnGuide(locale: string): Promise<{
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
    query.set("message", AuthFlashMessage.SignInToContinue);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);
  if (!guide || needsClaim) {
    redirectWithError(locale, GuideFlashError.ClaimBeforeSlots);
  }

  return { supabase, guideId: guide.id };
}

/**
 * Opens one time slot, or the same slot across a range of dates.
 *
 * A slot is a block of the guide's day; a traveller takes the whole thing. That
 * is why there is no capacity field here any more — the old `spots` number was
 * only meaningful when a tour was selling seats.
 *
 * Existing slots at the same start time are left as they are rather than
 * overwritten, so re-submitting a wider range cannot silently move the end time
 * of a slot somebody has already booked.
 */
export async function addSlotsAction(formData: FormData) {
  const parsed = addSchema.safeParse({
    locale: getString(formData, "locale"),
    startDate: getString(formData, "startDate"),
    endDate: getString(formData, "endDate"),
    startTime: getString(formData, "startTime"),
    endTime: getString(formData, "endTime"),
    note: getString(formData, "note"),
  });

  if (!parsed.success) {
    const locale = getString(formData, "locale") || "en";
    redirectWithError(locale, GuideFlashError.CheckSlotTimes);
  }

  const { locale, startDate, startTime, endTime } = parsed.data;
  const endDate = parsed.data.endDate || startDate;
  const note = parsed.data.note?.trim() || null;

  if (endTime <= startTime) {
    redirectWithError(locale, GuideFlashError.EndTimeBeforeStartTime);
  }
  if (endDate < startDate) {
    redirectWithError(locale, GuideFlashError.EndBeforeStart);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today) {
    redirectWithError(locale, GuideFlashError.DatesInPast);
  }

  const weekdays = new Set(
    formData
      .getAll("weekdays")
      .map((value) => String(value))
      .filter((value) => (WEEKDAY_VALUES as readonly string[]).includes(value))
  );

  const { supabase, guideId } = await requireOwnGuide(locale);

  const candidates = eachDate(startDate, endDate).filter((date) => {
    if (date < today) return false;
    if (weekdays.size === 0) return true;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    return weekdays.has(String(weekday));
  });

  if (candidates.length === 0) {
    redirectWithError(locale, GuideFlashError.NoDatesMatched);
  }
  if (candidates.length > MAX_DATES_PER_SUBMIT) {
    redirectWithError(locale, GuideFlashError.RangeTooLong, MAX_DATES_PER_SUBMIT);
  }

  const rows = candidates.map((date) => ({
    guide_id: guideId,
    date,
    start_time: startTime,
    end_time: endTime,
    note,
  }));

  const { data: inserted, error } = await supabase
    .from("guide_availability")
    .upsert(rows, {
      onConflict: "guide_id,date,start_time",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    console.warn("[guide.events] failed to insert slots", error);
    if (error.code === "42501") {
      redirectWithError(locale, GuideFlashError.SlotPolicyMissing);
    }
    redirectWithError(locale, GuideFlashError.SaveSlotsFailed);
  }

  revalidatePath(`/${locale}/guide/events`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/guides/${guideId}`);

  redirectWithStatus(
    locale,
    GuideFlashStatus.SlotsOpened,
    inserted?.length ?? rows.length
  );
}

/** Removes a slot, unless a traveller is already on it. */
export async function removeSlotAction(formData: FormData) {
  const parsed = removeSchema.safeParse({
    locale: getString(formData, "locale"),
    slotId: getString(formData, "slotId"),
  });

  if (!parsed.success) {
    redirectWithError(
      getString(formData, "locale") || "en",
      GuideFlashError.InvalidRequest
    );
  }

  const { locale, slotId } = parsed.data;
  const { supabase, guideId } = await requireOwnGuide(locale);

  const { data: slot } = await supabase
    .from("guide_availability")
    .select("id")
    .eq("id", slotId)
    .eq("guide_id", guideId)
    .maybeSingle();

  if (!slot?.id) {
    redirectWithError(locale, GuideFlashError.SlotNotYours);
  }

  const { data: active } = await supabase
    .from("reservations")
    .select("id")
    .eq("availability_id", slotId)
    .in("status", ["pending", "confirmed"])
    .limit(1);

  if (active && active.length > 0) {
    redirectWithError(locale, GuideFlashError.SlotHasBooking);
  }

  const { error } = await supabase
    .from("guide_availability")
    .delete()
    .eq("id", slotId)
    .eq("guide_id", guideId);

  if (error) {
    console.warn("[guide.events] failed to delete slot", error);
    redirectWithError(locale, GuideFlashError.RemoveSlotFailed);
  }

  revalidatePath(`/${locale}/guide/events`);
  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/schedule`);
  revalidatePath(`/${locale}/guides/${guideId}`);

  redirectWithStatus(locale, GuideFlashStatus.SlotRemoved);
}
