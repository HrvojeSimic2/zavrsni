"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getGuideForUser } from "@/lib/guide/get-guide-for-user";
import { getFileFromFormData, uploadAvatarFile } from "@/lib/supabase/storage";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";
import { GuideFlashError } from "@/lib/i18n/guide-flash";
import { toSpecialties } from "@/lib/types/specialty";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const profileSchema = z.object({
  name: z.string().trim().min(2, GuideFlashError.NameTooShort).max(80),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(120).optional(),
  languages: z.string().trim().max(200).optional(),
  yearsExperience: z.string().trim().optional(),
  website: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  hourlyRate: z.string().trim().optional(),
  maxGroupSize: z.string().trim().optional(),
  defaultMeetingPoint: z.string().trim().max(200).optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseLanguages(value: string): string[] | null {
  const languages = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return languages.length > 0 ? Array.from(new Set(languages)) : null;
}

function normalizeWebsite(value: string): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function redirectWithError(locale: string, message: string): never {
  const query = new URLSearchParams();
  query.set("error", message);
  redirect(`/${locale}/guide/profile?${query.toString()}`);
}

export async function updateGuideProfileAction(formData: FormData) {
  const locale = getString(formData, "locale") || "en";

  const parsed = profileSchema.safeParse({
    name: getString(formData, "name"),
    headline: getString(formData, "headline"),
    bio: getString(formData, "bio"),
    location: getString(formData, "location"),
    languages: getString(formData, "languages"),
    yearsExperience: getString(formData, "yearsExperience"),
    website: getString(formData, "website"),
    phone: getString(formData, "phone"),
    hourlyRate: getString(formData, "hourlyRate"),
    maxGroupSize: getString(formData, "maxGroupSize"),
    defaultMeetingPoint: getString(formData, "defaultMeetingPoint"),
  });

  if (!parsed.success) {
    redirectWithError(
      locale,
      parsed.error.issues[0]?.message ?? GuideFlashError.CheckForm
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const query = new URLSearchParams();
    query.set("next", `/${locale}/guide/profile`);
    query.set("message", AuthFlashMessage.SignInToContinue);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);

  if (!guide) {
    redirectWithError(locale, GuideFlashError.NoGuideProfile);
  }

  if (needsClaim) {
    redirectWithError(locale, GuideFlashError.ClaimBeforeEditing);
  }

  const years = parsed.data.yearsExperience;
  let yearsExperience: number | null = null;
  if (years) {
    const numeric = Number(years);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 80) {
      redirectWithError(locale, GuideFlashError.YearsRange);
    }
    yearsExperience = Math.round(numeric);
  }

  // An empty rate is a deliberate state: "ask me". It is not zero.
  let hourlyRate: number | null = null;
  if (parsed.data.hourlyRate) {
    const numeric = Number(parsed.data.hourlyRate.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10000) {
      redirectWithError(locale, GuideFlashError.RateInvalid);
    }
    hourlyRate = Math.round(numeric * 100) / 100;
  }

  let maxGroupSize = 6;
  if (parsed.data.maxGroupSize) {
    const numeric = Number(parsed.data.maxGroupSize);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 100) {
      redirectWithError(locale, GuideFlashError.GroupSizeInvalid);
    }
    maxGroupSize = Math.round(numeric);
  }

  const specialties = toSpecialties(formData.getAll("specialties").map(String));

  let avatarUrl: string | undefined;
  const photo = getFileFromFormData(formData, "photo");

  if (photo) {
    if (!photo.type.startsWith("image/")) {
      redirectWithError(locale, GuideFlashError.PhotoMustBeImage);
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      redirectWithError(locale, GuideFlashError.PhotoTooLarge);
    }

    const upload = await uploadAvatarFile(supabase, user.id, photo);
    if (upload.error || !upload.publicUrl) {
      console.warn("[guide.profile] failed to upload photo", upload.error);
      redirectWithError(locale, GuideFlashError.PhotoUploadFailed);
    }

    // Bust the CDN cache: the object key is stable per user.
    avatarUrl = `${upload.publicUrl}?v=${Date.now()}`;
  }

  const { error: updateError } = await supabase
    .from("guides")
    .update({
      name: parsed.data.name,
      headline: parsed.data.headline || null,
      bio: parsed.data.bio || null,
      location: parsed.data.location || null,
      languages: parseLanguages(parsed.data.languages ?? ""),
      years_experience: yearsExperience,
      website: normalizeWebsite(parsed.data.website ?? ""),
      phone: parsed.data.phone || null,
      hourly_rate: hourlyRate,
      max_group_size: maxGroupSize,
      default_meeting_point: parsed.data.defaultMeetingPoint || null,
      specialties,
      ...(avatarUrl ? { avatar: avatarUrl } : {}),
    })
    .eq("id", guide.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.warn("[guide.profile] failed to update guide profile", updateError);
    redirectWithError(locale, GuideFlashError.ProfileSaveFailed);
  }

  revalidatePath(`/${locale}/guide/profile`);
  revalidatePath(`/${locale}/guides/${guide.id}`);
  revalidatePath(`/${locale}/browse`);

  const query = new URLSearchParams();
  query.set("status", "saved");
  redirect(`/${locale}/guide/profile?${query.toString()}`);
}
