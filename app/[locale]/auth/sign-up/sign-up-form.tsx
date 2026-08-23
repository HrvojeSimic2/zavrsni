"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { savePendingAvatar } from "@/lib/supabase/pending-avatar";
import { getFileFromFormData, uploadAvatarFile } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { AuthFlashError, AuthFlashMessage } from "@/lib/i18n/auth-flash";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
  redirectTo: string;
};

function safePath(path: string, fallback: string) {
  if (path.startsWith("/")) return path;
  return fallback;
}

export function SignUpForm({ locale, redirectTo }: Props) {
  const t = useTranslations("Auth.signUp");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          const supabase = createClient();
          const form = event.currentTarget;
          const formData = new FormData(form);

          const fullName = String(formData.get("fullName") ?? "").trim();
          const avatarFile = getFileFromFormData(formData, "avatarFile");
          const email = String(formData.get("email") ?? "").trim();
          const password = String(formData.get("password") ?? "");
          const confirmPassword = String(formData.get("confirmPassword") ?? "");

          if (!email || !password) {
            router.replace(
              `/${locale}/auth/sign-up?error=${encodeURIComponent(
                AuthFlashError.EmailPasswordRequired
              )}`
            );
            return;
          }

          if (!fullName) {
            router.replace(
              `/${locale}/auth/sign-up?error=${encodeURIComponent(
                AuthFlashError.FullNameRequired
              )}`
            );
            return;
          }

          if (password !== confirmPassword) {
            router.replace(
              `/${locale}/auth/sign-up?error=${encodeURIComponent(
                AuthFlashError.PasswordsMismatch
              )}`
            );
            return;
          }

          const safeRedirectTo = safePath(redirectTo, `/${locale}`);
          const origin = window.location.origin;
          const callbackUrl = `${origin}/${locale}/auth/callback?next=${encodeURIComponent(
            safeRedirectTo
          )}`;

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                avatar_url: null,
                locale,
              },
              emailRedirectTo: callbackUrl,
            },
          });

          if (error) {
            router.replace(
              `/${locale}/auth/sign-up?error=${encodeURIComponent(error.message)}`
            );
            return;
          }

          if (avatarFile && !data.session?.user) {
            try {
              await savePendingAvatar(email, avatarFile);
            } catch (persistError) {
              console.warn(
                "[auth.signUp] failed to persist pending avatar",
                persistError
              );
            }
          }

          if (avatarFile && data.session?.user) {
            const { publicUrl, error: uploadError } = await uploadAvatarFile(
              supabase,
              data.session.user.id,
              avatarFile
            );

            if (!uploadError && publicUrl) {
              const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;
              await Promise.allSettled([
                supabase.auth.updateUser({
                  data: { avatar_url: cacheBustedUrl },
                }),
                supabase
                  .from("profiles")
                  .update({ avatar_url: cacheBustedUrl })
                  .eq("id", data.session.user.id),
              ]);
            } else {
              console.warn(
                "[auth.signUp] avatar upload failed",
                uploadError?.message ?? uploadError
              );
            }
          }

          if (data.session) {
            router.push(safeRedirectTo);
            return;
          }

          router.push(
            `/${locale}/auth/sign-in?message=${encodeURIComponent(
              AuthFlashMessage.CheckEmail
            )}`
          );
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatarFile">{t("avatarLabel")}</Label>
        <Input
          id="avatarFile"
          name="avatarFile"
          type="file"
          accept="image/*"
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}



