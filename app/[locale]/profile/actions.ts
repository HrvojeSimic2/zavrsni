"use server";

import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getFileFromFormData, uploadAvatarFile } from "@/lib/supabase/storage";
import { redirect } from "next/navigation";
import {
  PROFILE_FLASH_QUERY,
  ProfileFlashErrorKey,
  ProfileFlashMessageKey,
} from "./flash";

type MessageType = "error" | "message";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const SUPPORTED_LOCALE_SET = new Set<Locale>(locales);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALE_SET.has(value as Locale);
}

function resolveLocale(value: string, fallback: string): Locale {
  const candidate = value.trim();
  if (isLocale(candidate)) return candidate;

  const fallbackCandidate = fallback.trim();
  if (isLocale(fallbackCandidate)) return fallbackCandidate;

  return defaultLocale;
}

function redirectWithMessage(
  locale: Locale,
  type: MessageType,
  key: string
): never {
  const params = new URLSearchParams();
  params.set(
    type === "message"
      ? PROFILE_FLASH_QUERY.messageKey
      : PROFILE_FLASH_QUERY.errorKey,
    key
  );
  redirect(`/${locale}/profile?${params.toString()}`);
}

function redirectToSignIn(locale: Locale): never {
  const next = `/${locale}/profile`;
  const params = new URLSearchParams();
  params.set("next", next);
  params.set("message", "Please sign in to continue.");
  redirect(`/${locale}/auth/sign-in?${params.toString()}`);
}

export async function updateProfileAction(formData: FormData) {
  const currentLocale = resolveLocale(getString(formData, "locale"), defaultLocale);
  const fullName = getString(formData, "fullName");
  const preferredLocale = resolveLocale(
    getString(formData, "preferredLocale") || currentLocale,
    currentLocale
  );

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectToSignIn(currentLocale);
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName || null,
    locale: preferredLocale || null,
  });

  if (profileError) {
    console.warn("[profile.update] profile upsert failed", profileError);
    redirectWithMessage(
      currentLocale,
      "error",
      ProfileFlashErrorKey.SaveFailed
    );
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName || null,
      locale: preferredLocale || null,
    },
  });

  if (authError) {
    console.warn("[profile.update] auth metadata update failed", authError);
  }

  redirectWithMessage(
    preferredLocale,
    "message",
    ProfileFlashMessageKey.ProfileUpdated
  );
}

export async function updateAvatarAction(formData: FormData) {
  const currentLocale = resolveLocale(getString(formData, "locale"), defaultLocale);
  const file = getFileFromFormData(formData, "avatarFile");

  if (!file) {
    redirectWithMessage(
      currentLocale,
      "error",
      ProfileFlashErrorKey.ChooseImage
    );
  }

  if (!file.type.startsWith("image/")) {
    redirectWithMessage(
      currentLocale,
      "error",
      ProfileFlashErrorKey.ImageOnly
    );
  }

  if (file.size > MAX_AVATAR_BYTES) {
    redirectWithMessage(currentLocale, "error", ProfileFlashErrorKey.MaxSize);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectToSignIn(currentLocale);
  }

  const uploadResult = await uploadAvatarFile(supabase, user.id, file);

  if ("error" in uploadResult) {
    console.warn("[profile.avatar] upload failed", uploadResult.error);
    redirectWithMessage(
      currentLocale,
      "error",
      ProfileFlashErrorKey.UploadFailed
    );
  }

  if (!uploadResult.publicUrl) {
    redirectWithMessage(currentLocale, "error", ProfileFlashErrorKey.UploadFailed);
  }

  const cacheBustedUrl = `${uploadResult.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    avatar_url: cacheBustedUrl,
  });

  if (profileError) {
    console.warn("[profile.avatar] profile upsert failed", profileError);
    redirectWithMessage(currentLocale, "error", ProfileFlashErrorKey.UploadFailed);
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: cacheBustedUrl },
  });

  if (authError) {
    console.warn("[profile.avatar] auth metadata update failed", authError);
  }

  redirectWithMessage(
    currentLocale,
    "message",
    ProfileFlashMessageKey.PhotoUpdated
  );
}
