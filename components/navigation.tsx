'use client'

import { Link } from "@/i18n/routing";
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useLocale } from "next-intl";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const locale = useLocale()

  const navLinks = [
    { href: "/browse", label: "Browse Tours" },
    { href: "/become-guide", label: "Become a Guide" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  const closeMenu = () => setIsMobileMenuOpen(false)
  const signOutAction = `/${locale}/auth/sign-out`

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
              <form action={signOutAction} method="post" className="hidden md:flex">
                <Button variant="ghost" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                  <Link href="/auth/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" className="hidden md:inline-flex" asChild>
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </>
            )}
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
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  className="justify-start"
                  asChild
                >
                  <Link href="/auth/sign-in" onClick={closeMenu}>
                    Sign In
                  </Link>
                </Button>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/auth/sign-up" onClick={closeMenu}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
