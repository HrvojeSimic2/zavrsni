import type { SupabaseClient, User } from "@supabase/supabase-js";

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/**
 * Makes sure the signed-in user has a `profiles` row.
 *
 * The `handle_new_user` trigger covers the normal sign-up path, but OAuth users
 * (and any account created before the trigger existed) can end up without one,
 * which breaks the navigation avatar and the profile page.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  fallbackLocale?: string
) {
  const metadata = user.user_metadata ?? {};

  const fullName = firstString(
    metadata.full_name,
    metadata.name,
    user.email?.split("@")[0]
  );
  const avatarUrl = firstString(metadata.avatar_url, metadata.picture);
  const locale = firstString(metadata.locale, fallbackLocale);

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, locale")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.warn("[ensureProfile] lookup failed", selectError.message);
    return;
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      locale,
    });

    if (insertError) {
      console.warn("[ensureProfile] insert failed", insertError.message);
    }
    return;
  }

  // Backfill only the fields the profile is still missing.
  const patch: Record<string, string> = {};
  if (!existing.full_name && fullName) patch.full_name = fullName;
  if (!existing.avatar_url && avatarUrl) patch.avatar_url = avatarUrl;
  if (!existing.locale && locale) patch.locale = locale;

  if (Object.keys(patch).length === 0) return;

  const { error: updateError } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (updateError) {
    console.warn("[ensureProfile] backfill failed", updateError.message);
  }
}
