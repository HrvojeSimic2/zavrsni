import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { locales } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { updateAvatarAction, updateProfileAction } from "./actions";
import {
  isProfileFlashErrorKey,
  isProfileFlashMessageKey,
  PROFILE_FLASH_QUERY,
} from "./flash";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { error?: string; message?: string; errorKey?: string; messageKey?: string }
    | Promise<{
        error?: string;
        message?: string;
        errorKey?: string;
        messageKey?: string;
      }>;
};

function getInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
}

function getUserMetadataString(user: User, key: string): string | null {
  const metadata =
    user.user_metadata as Record<string, unknown> | null | undefined;
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

function formatMonthYear(locale: string, value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(date);
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations("Profile");
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const error = typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : "";
  const message =
    typeof resolvedSearchParams?.message === "string" ? resolvedSearchParams.message : "";
  const errorKey =
    typeof resolvedSearchParams?.[PROFILE_FLASH_QUERY.errorKey] === "string"
      ? resolvedSearchParams[PROFILE_FLASH_QUERY.errorKey]
      : "";
  const messageKey =
    typeof resolvedSearchParams?.[PROFILE_FLASH_QUERY.messageKey] === "string"
      ? resolvedSearchParams[PROFILE_FLASH_QUERY.messageKey]
      : "";

  const translatedError = errorKey && isProfileFlashErrorKey(errorKey) ? t(`flash.errors.${errorKey}`) : "";
  const translatedMessage =
    messageKey && isProfileFlashMessageKey(messageKey)
      ? t(`flash.messages.${messageKey}`)
      : "";

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const next = `/${locale}/profile`;
    const query = new URLSearchParams();
    query.set("next", next);
    query.set("message", "Please sign in to view your profile.");
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, locale, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.warn("[profile.page] failed to load profile", profileError);
  }

  const fullName =
    profile?.full_name ?? getUserMetadataString(user, "full_name") ?? "";
  const avatarUrl =
    profile?.avatar_url ?? getUserMetadataString(user, "avatar_url");
  const preferredLocale =
    profile?.locale ?? getUserMetadataString(user, "locale") ?? locale;
  const displayName = fullName || user.email || t("fallbackDisplayName");

  const memberSince =
    formatMonthYear(locale, profile?.created_at) ??
    formatMonthYear(locale, user.created_at);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 py-10">
        <div className="container max-w-4xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{t("title")}</h1>
              <p className="text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>

            <form action={`/${locale}/auth/sign-out`} method="post">
              <Button variant="outline" type="submit">
                {t("signOut")}
              </Button>
            </form>
          </div>

          {translatedError || error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {translatedError || error}
            </div>
          ) : null}
          {translatedMessage || message ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {translatedMessage || message}
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-[320px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{t("photoTitle")}</CardTitle>
                <CardDescription>{t("photoSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={avatarUrl ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{displayName}</div>
                    {memberSince ? (
                      <div className="text-sm text-muted-foreground">
                        {t("memberSince", { date: memberSince })}
                      </div>
                    ) : null}
                  </div>
                </div>

                <form action={updateAvatarAction} className="space-y-4">
                  <input type="hidden" name="locale" value={locale} />

                  <div className="space-y-2">
                    <Label htmlFor="avatarFile">{t("uploadLabel")}</Label>
                    <Input
                      id="avatarFile"
                      name="avatarFile"
                      type="file"
                      accept="image/*"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("uploadHelp")}
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    {t("uploadButton")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("detailsTitle")}</CardTitle>
                <CardDescription>
                  {t("detailsSubtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateProfileAction} className="space-y-4">
                  <input type="hidden" name="locale" value={locale} />

                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      defaultValue={fullName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("emailLabel")}</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user.email ?? ""}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredLocale">
                      {t("preferredLanguageLabel")}
                    </Label>
                    <select
                      id="preferredLocale"
                      name="preferredLocale"
                      defaultValue={preferredLocale}
                      className="border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                      {locales.map((supportedLocale) => (
                        <option
                          key={supportedLocale}
                          value={supportedLocale}
                        >
                          {supportedLocale.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit">{t("saveChanges")}</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {profileError ? (
            <p className="text-xs text-muted-foreground">
              {t("profileLoadWarning")}
            </p>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
