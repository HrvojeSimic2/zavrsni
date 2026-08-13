import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";

export async function requireAdminUser(locale: string, nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const query = new URLSearchParams();
    query.set("next", nextPath);
    query.set("message", "Please sign in to continue.");
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  if (!isAdminEmail(user.email)) {
    const query = new URLSearchParams();
    query.set("message", "You do not have access to that page.");
    redirect(`/${locale}?${query.toString()}`);
  }

  return user;
}

