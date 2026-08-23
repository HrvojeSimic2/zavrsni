import { getTranslations } from "next-intl/server";

import { signInAction } from "../actions";
import { AuthDivider, GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveFlash } from "@/lib/i18n/flash";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { error?: string; message?: string; next?: string }
    | Promise<{ error?: string; message?: string; next?: string }>;
};

function safePath(path: string, fallback: string) {
  if (path.startsWith("/")) {
    return path;
  }
  return fallback;
}

export default async function SignInPage({ params, searchParams }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const tAuth = await getTranslations("Auth");
  const t = await getTranslations("Auth.signIn");
  const error = resolveFlash(
    tAuth,
    "errors",
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : ""
  );
  const message = resolveFlash(
    tAuth,
    "messages",
    typeof resolvedSearchParams?.message === "string"
      ? resolvedSearchParams.message
      : ""
  );
  const next =
    typeof resolvedSearchParams?.next === "string"
      ? resolvedSearchParams.next
      : "";
  const redirectTo = safePath(next || `/${locale}`, `/${locale}`);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        <GoogleSignInButton locale={locale} redirectTo={redirectTo} />
        <AuthDivider />
        <form action={signInAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input
            type="hidden"
            name="redirectTo"
            value={redirectTo}
          />
          <div className="space-y-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
          <Button type="submit" className="w-full">
            {t("submit")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <span>
          {t("newHere")}{" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            {t("createAccount")}
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
