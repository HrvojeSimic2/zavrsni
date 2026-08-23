import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getGuideForUser, type GuideRow } from "@/lib/guide/get-guide-for-user";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";

export type RequireGuideResult = {
  supabase: SupabaseClient;
  guide: GuideRow;
  needsClaim: boolean;
};

/**
 * Guard for every page under /guide: sends anonymous visitors to sign-in and
 * users without a guide profile to the application form.
 */
export async function requireGuide(
  locale: string,
  path: string
): Promise<RequireGuideResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const query = new URLSearchParams();
    query.set("next", `/${locale}${path}`);
    query.set("message", AuthFlashMessage.SignInForGuideDashboard);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { guide, needsClaim } = await getGuideForUser(supabase, user);

  if (!guide) {
    const query = new URLSearchParams();
    query.set("message", AuthFlashMessage.ApplyToBecomeGuide);
    redirect(`/${locale}/become-guide?${query.toString()}`);
  }

  return { supabase, guide, needsClaim };
}
