import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";

export async function requireAdminUser(locale: string, nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const query = new URLSearchParams();
    query.set("next", nextPath);
    query.set("message", AuthFlashMessage.SignInToContinue);
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  if (!isAdminEmail(user.email)) {
    const query = new URLSearchParams();
    query.set("message", AuthFlashMessage.NoAccess);
    redirect(`/${locale}?${query.toString()}`);
  }

  return user;
}

