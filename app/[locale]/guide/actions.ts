"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";
import { GuideFlashError } from "@/lib/i18n/guide-flash";

const claimSchema = z.object({
  locale: z.string().min(2),
  guideId: z.string().uuid(),
});

export async function claimGuideProfileAction(formData: FormData) {
  const raw = {
    locale: String(formData.get("locale") ?? ""),
    guideId: String(formData.get("guideId") ?? ""),
  };

  const parsed = claimSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(GuideFlashError.InvalidClaim);
  }

  const { locale, guideId } = parsed.data;
  const nextPath = `/${locale}/guide`;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const query = new URLSearchParams();
    query.set("next", nextPath);
    query.set("message", AuthFlashMessage.SignInToContinue);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .select("id, email, user_id")
    .eq("id", guideId)
    .maybeSingle();

  if (guideError || !guide) {
    console.warn("[guide.claim] failed to load guide profile", guideError);
    throw new Error(GuideFlashError.ClaimLoadFailed);
  }

  const normalizedUserEmail = String(user.email ?? "").trim().toLowerCase();
  const normalizedGuideEmail = String(guide.email ?? "").trim().toLowerCase();

  if (
    !normalizedUserEmail ||
    !normalizedGuideEmail ||
    normalizedUserEmail !== normalizedGuideEmail
  ) {
    throw new Error(GuideFlashError.ClaimNotYours);
  }

  if (guide.user_id && guide.user_id !== user.id) {
    throw new Error(GuideFlashError.AlreadyClaimed);
  }

  if (guide.user_id === user.id) {
    redirect(nextPath);
  }

  const { error: updateError } = await supabase
    .from("guides")
    .update({ user_id: user.id })
    .eq("id", guideId)
    .is("user_id", null);

  if (updateError) {
    console.warn("[guide.claim] failed to claim guide profile", updateError);
    throw new Error(GuideFlashError.ClaimFailed);
  }

  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/events`);
  revalidatePath(`/${locale}/guide/reservations`);
  redirect(nextPath);
}

