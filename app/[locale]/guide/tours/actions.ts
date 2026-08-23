"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getGuideForUser } from "@/lib/guide/get-guide-for-user";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";
import { GuideFlashError } from "@/lib/i18n/guide-flash";

const categorySchema = z.enum([
  "food",
  "nature",
  "culture",
  "adventure",
  "history",
]);

const createTourSchema = z.object({
  locale: z.string().min(2),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(10).max(4000),
  category: categorySchema,
  location: z.string().trim().min(2).max(200),
  country: z.string().trim().min(2).max(120),
  price: z
    .string()
    .trim()
    .transform((value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return NaN;
      return parsed;
    })
    .refine((value) => Number.isFinite(value) && value >= 0, {
      message: GuideFlashError.PriceInvalid,
    }),
  duration: z.string().trim().min(1).max(80),
  groupSize: z.string().trim().min(1).max(80),
  meetingPoint: z.string().trim().max(200).optional(),
  startTime: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^d{2}:d{2}$/.test(value), {
      message: GuideFlashError.StartTimeInvalid,
    }),
  image: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value ? value : undefined)),
  highlightsRaw: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value ? value : "")),
});

function parseHighlights(value: string): string[] {
  const tokens = value
    .split(/[\n,]+/g)
    .map((token) => token.trim())
    .filter(Boolean);

  return Array.from(new Set(tokens)).slice(0, 12);
}

export async function createTourAction(formData: FormData) {
  const tourId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const raw = {
    locale: String(formData.get("locale") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    location: String(formData.get("location") ?? ""),
    country: String(formData.get("country") ?? ""),
    price: String(formData.get("price") ?? ""),
    duration: String(formData.get("duration") ?? ""),
    groupSize: String(formData.get("groupSize") ?? ""),
    meetingPoint: String(formData.get("meetingPoint") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    image: String(formData.get("image") ?? ""),
    highlightsRaw: String(formData.get("highlights") ?? ""),
  };

  const parsed = createTourSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(GuideFlashError.InvalidTourDetails);
  }

  const {
    locale,
    title,
    description,
    category,
    location,
    country,
    price,
    duration,
    groupSize,
    meetingPoint,
    startTime,
    image,
    highlightsRaw,
  } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const nextPath = `/${locale}/guide/tours/new`;
    const query = new URLSearchParams();
    query.set("next", nextPath);
    query.set("message", AuthFlashMessage.SignInToContinue);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);
  if (!guide) {
    const query = new URLSearchParams();
    query.set("message", AuthFlashMessage.ApplyToBecomeGuide);
    redirect(`/${locale}/become-guide?${query.toString()}`);
  }
  if (needsClaim) {
    const query = new URLSearchParams();
    query.set("message", AuthFlashMessage.ClaimGuideProfile);
    redirect(`/${locale}/guide?${query.toString()}`);
  }

  const highlights = parseHighlights(highlightsRaw);

  const { data: created, error: insertError } = await supabase
    .from("tours")
    .insert({
      id: tourId,
      title,
      description,
      category,
      location,
      country,
      price,
      duration,
      meeting_point: meetingPoint || null,
      start_time: startTime || null,
      image: image ?? null,
      group_size: groupSize,
      highlights,
      guide_id: guide.id,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.warn("[guide.tours] failed to create tour", insertError);
    if (
      insertError.code === "42501" &&
      process.env.NODE_ENV !== "production"
    ) {
      throw new Error(GuideFlashError.TourPolicyMissing);
    }
    throw new Error(GuideFlashError.CreateTourFailed);
  }

  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/tours`);
  const createdId = created?.id;
  redirect(`/${locale}/guide/tours${createdId ? `?created=${createdId}` : ""}`);
}
