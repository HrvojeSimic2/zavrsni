import type { SupabaseClient, User } from "@supabase/supabase-js";

export type GuideRow = {
  id: string;
  name: string;
  avatar: string | null;
  languages: string[] | null;
  verified: boolean | null;
  user_id: string | null;
  email: string | null;
};

export type GuideForUserResult = {
  guide: GuideRow | null;
  needsClaim: boolean;
};

export async function getGuideForUser(
  supabase: SupabaseClient,
  user: User
): Promise<GuideForUserResult> {
  const { data: byUser } = await supabase
    .from("guides")
    .select("id, name, avatar, languages, verified, user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (byUser?.id) {
    return { guide: byUser as GuideRow, needsClaim: false };
  }

  const normalizedEmail = String(user.email ?? "").trim().toLowerCase();
  if (!normalizedEmail) {
    return { guide: null, needsClaim: false };
  }

  const { data: byEmail } = await supabase
    .from("guides")
    .select("id, name, avatar, languages, verified, user_id, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!byEmail?.id) {
    return { guide: null, needsClaim: false };
  }

  const needsClaim = !byEmail.user_id;
  return { guide: byEmail as GuideRow, needsClaim };
}

