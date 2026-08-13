'use client'

import { Link } from "@/i18n/routing";
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { createClient } from "@/lib/supabase/client";
import { clearPendingAvatar, loadPendingAvatar } from "@/lib/supabase/pending-avatar";
import { uploadAvatarFile } from "@/lib/supabase/storage";
import type { Session } from "@supabase/supabase-js";
import { useLocale, useTranslations } from "next-intl";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
};

function getNameAndSurname(fullName: string) {
  const parts = fullName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function getInitials(name: string) {
  const parts = name
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

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // `undefined` means "still loading" to avoid flashing signed-out UI.
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasGuideDashboard, setHasGuideDashboard] = useState<boolean>(false);
  const pendingAvatarSyncKeyRef = useRef<string | null>(null);
  const locale = useLocale()
  const t = useTranslations("Navigation");
  const isSessionLoaded = session !== undefined;

  const navLinks = [
    { href: "/browse", label: t("browse") },
    hasGuideDashboard
      ? { href: "/guide", label: t("dashboard") }
      : { href: "/become-guide", label: t("guide") },
    { href: "/how-it-works", label: t("how") },
    ...(session ? [{ href: "/bookings", label: t("trips") }] : []),
  ];

  const closeMenu = () => setIsMobileMenuOpen(false)
  const signOutAction = `/${locale}/auth/sign-out`

  useEffect(() => {
    const supabase = createClient()
    let isActive = true;

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (!isActive) return;
      if (error) {
        setProfile(null);
        return null;
      }

      setProfile(data ?? null);
      return data ?? null;
    }

    async function loadGuideStatus(userId: string, email: string) {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: guideByUser, error: guideByUserError } = await supabase
        .from("guides")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isActive) return;

      if (guideByUserError) {
        console.warn("[nav.guides] failed to check guide by user_id", guideByUserError);
      }

      if (guideByUser?.id) {
        setHasGuideDashboard(true);
        return;
      }

      if (!normalizedEmail) {
        setHasGuideDashboard(false);
        return;
      }

      const { data: guideByEmail, error: guideByEmailError } = await supabase
        .from("guides")
        .select("id, user_id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (!isActive) return;

      if (guideByEmailError) {
        console.warn("[nav.guides] failed to check guide by email", guideByEmailError);
      }

      setHasGuideDashboard(Boolean(guideByEmail?.id));
    }

    async function syncPendingAvatar(userId: string, email: string, hasAvatar: boolean) {
      if (!email) return;
      if (hasAvatar) return;

      const pending = await loadPendingAvatar(email);
      if (!pending) return;

      const syncKey = `${userId}:${email}:${pending.name}:${pending.size}:${pending.lastModified}`;
      if (pendingAvatarSyncKeyRef.current === syncKey) return;
      pendingAvatarSyncKeyRef.current = syncKey;

      const { publicUrl, error: uploadError } = await uploadAvatarFile(
        supabase,
        userId,
        pending
      );

      if (uploadError || !publicUrl) {
        console.warn(
          "[nav.avatar] pending avatar upload failed",
          uploadError?.message ?? uploadError
        );
        return;
      }

      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;
      await Promise.allSettled([
        supabase.auth.updateUser({
          data: { avatar_url: cacheBustedUrl },
        }),
        supabase
          .from("profiles")
          .update({ avatar_url: cacheBustedUrl })
          .eq("id", userId),
      ]);

      await clearPendingAvatar(email);
      await loadProfile(userId);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      setSession(data.session)
      const userId = data.session?.user?.id;
      if (userId) {
        const email = data.session?.user?.email ?? "";
        const metaAvatar =
          (data.session?.user.user_metadata?.avatar_url as string | undefined) ??
          "";
        void loadGuideStatus(userId, email);
        void loadProfile(userId).then((loadedProfile) => {
          const hasAvatar = Boolean((loadedProfile?.avatar_url ?? "").trim() || metaAvatar.trim());
          void syncPendingAvatar(userId, email, hasAvatar);
        });
      } else {
        setProfile(null);
        setHasGuideDashboard(false);
        pendingAvatarSyncKeyRef.current = null;
      }
    }).catch((error) => {
      if (!isActive) return;
      console.warn("[nav.auth] failed to get session", error);
      setSession(null);
      setProfile(null);
      setHasGuideDashboard(false);
      pendingAvatarSyncKeyRef.current = null;
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;
      setSession(nextSession)
      const userId = nextSession?.user?.id;
      if (userId) {
        const email = nextSession?.user?.email ?? "";
        const metaAvatar =
          (nextSession?.user.user_metadata?.avatar_url as string | undefined) ??
          "";
        void loadGuideStatus(userId, email);
        void loadProfile(userId).then((loadedProfile) => {
          const hasAvatar = Boolean((loadedProfile?.avatar_url ?? "").trim() || metaAvatar.trim());
          void syncPendingAvatar(userId, email, hasAvatar);
        });
      } else {
        setProfile(null);
        setHasGuideDashboard(false);
        pendingAvatarSyncKeyRef.current = null;
      }
    })

    return () => {
      isActive = false;
      subscription.unsubscribe()
    }
  }, [])

  const profileName =
    profile?.full_name ??
    (session?.user.user_metadata?.full_name as string | undefined) ??
    "";

  const displayName = (() => {
    const trimmed = profileName.trim();
    if (trimmed) return getNameAndSurname(trimmed);
    const email = session?.user.email ?? "";
    return email.includes("@") ? email.split("@")[0] : email;
  })();

  const avatarUrl =
    profile?.avatar_url ??
    (session?.user.user_metadata?.avatar_url as string | undefined) ??
    null;

  const avatarSrc = (avatarUrl ?? "").trim() || "/placeholder.svg";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={closeMenu}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">LocalPath</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LocaleSwitcher className="hidden md:flex" />
            {session ? (
              <>
                <NotificationsBell
                  userId={session.user.id}
                  className="hidden md:block"
                />
                <Link
                  href="/profile"
                  className="md:hidden"
                  aria-label="Open profile"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarSrc} alt={displayName} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </Link>
                <Link
                  href="/profile"
                  className="hidden md:flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted transition-colors"
                  aria-label="Open profile"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarSrc} alt={displayName} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-40 truncate">
                    {displayName}
                  </span>
                </Link>
                <form
                  action={signOutAction}
                  method="post"
                  className="hidden md:flex"
                >
                  <Button variant="ghost" size="sm" type="submit">
                    Sign Out
                  </Button>
                </form>
              </>
            ) : isSessionLoaded ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex"
                  asChild
                >
                  <Link href="/auth/sign-in">{t("signIn")}</Link>
                </Button>
                <Button size="sm" className="hidden md:inline-flex" asChild>
                  <Link href="/auth/sign-up">{t("getStarted")}</Link>
                </Button>
              </>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div
          className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          onClick={closeMenu}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-full max-w-sm bg-background border-l shadow-2xl flex flex-col",
            "transition-transform duration-300",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b px-6 py-4">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={closeMenu}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">LocalPath</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation menu"
              onClick={closeMenu}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col gap-5 px-6 py-8">
            {session && (
              <Link
                href="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-semibold leading-tight truncate">
                    {displayName}
                  </div>
                  {session.user.email && (
                    <div className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </div>
                  )}
                </div>
              </Link>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-lg font-semibold text-foreground/90 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {session && isMobileMenuOpen ? (
              <NotificationsBell
                userId={session.user.id}
                variant="inline"
                onNavigate={closeMenu}
              />
            ) : null}
            <LocaleSwitcher size="default" className="w-full justify-between" />
          </div>

          <div className="mt-auto border-t px-6 py-6 flex flex-col gap-3">
            {session ? (
              <form action={signOutAction} method="post">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start"
                  type="submit"
                  onClick={closeMenu}
                >
                  Sign Out
                </Button>
              </form>
            ) : isSessionLoaded ? (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  className="justify-start"
                  asChild
                >
                  <Link href="/auth/sign-in" onClick={closeMenu}>
                    {t("signIn")}
                  </Link>
                </Button>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/auth/sign-up" onClick={closeMenu}>
                    {t("getStarted")}
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
