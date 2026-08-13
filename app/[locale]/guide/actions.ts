"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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
    throw new Error("Invalid claim request.");
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
    query.set("message", "Please sign in to continue.");
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .select("id, email, user_id")
    .eq("id", guideId)
    .maybeSingle();

  if (guideError || !guide) {
    console.warn("[guide.claim] failed to load guide profile", guideError);
    throw new Error("Failed to load guide profile.");
  }

  const normalizedUserEmail = String(user.email ?? "").trim().toLowerCase();
  const normalizedGuideEmail = String(guide.email ?? "").trim().toLowerCase();

  if (
    !normalizedUserEmail ||
    !normalizedGuideEmail ||
    normalizedUserEmail !== normalizedGuideEmail
  ) {
    throw new Error("This guide profile cannot be claimed by your account.");
  }

  if (guide.user_id && guide.user_id !== user.id) {
    throw new Error("This guide profile is already claimed.");
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
    throw new Error("Failed to claim guide profile.");
  }

  revalidatePath(`/${locale}/guide`);
  revalidatePath(`/${locale}/guide/events`);
  revalidatePath(`/${locale}/guide/reservations`);
  redirect(nextPath);
}

