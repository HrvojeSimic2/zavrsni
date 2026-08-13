"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Clock,
  UserCheck,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/notifications/notifications";

type Props = {
  userId: string;
  className?: string;
  /** Mobile menu renders the list inline instead of as a dropdown. */
  variant?: "dropdown" | "inline";
  onNavigate?: () => void;
};

const REFRESH_INTERVAL_MS = 60_000;

function storageKey(userId: string) {
  return `localpath:notifications:last-seen:${userId}`;
}

function readLastSeen(userId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(storageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

function writeLastSeen(userId: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), value);
  } catch {
    // Private browsing or blocked storage: unread state is best-effort.
  }
}

function iconFor(kind: AppNotification["kind"], status: string | null) {
  switch (kind) {
    case "reservation_request":
      return Clock;
    case "reservation_confirmed":
      return CalendarCheck;
    case "reservation_declined":
      return CalendarX;
    case "reservation_pending":
      return Clock;
    case "guide_application":
      return status === "rejected" ? CalendarX : UserCheck;
    default:
      return Bell;
  }
}

export function NotificationsBell({
  userId,
  className,
  variant = "dropdown",
  onNavigate,
}: Props) {
  const t = useTranslations("Notifications");
  const locale = useLocale();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>("");
  // Frozen while the panel is open so rows don't lose their "new" dot mid-read.
  const [seenBaseline, setSeenBaseline] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = readLastSeen(userId);
    setLastSeen(stored);
    setSeenBaseline(stored);
  }, [userId]);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        notifications?: AppNotification[];
      };
      setNotifications(payload.notifications ?? []);
    } catch {
      // Offline or a transient failure: keep whatever is already rendered.
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const run = () => {
      if (!isActive) return;
      void load();
    };

    run();
    const interval = window.setInterval(run, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", run);

    return () => {
      isActive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", run);
    };
  }, [load]);

  useEffect(() => {
    if (!isOpen || variant !== "dropdown") return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, variant]);

  const unreadCount = useMemo(
    () =>
      notifications.filter((item) => !lastSeen || item.timestamp > lastSeen).length,
    [notifications, lastSeen]
  );

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    writeLastSeen(userId, now);
    setLastSeen(now);
  }, [userId]);

  const openPanel = useCallback(() => {
    setSeenBaseline(lastSeen);
    setIsOpen(true);
    markAllSeen();
  }, [lastSeen, markAllSeen]);

  // The inline (mobile) variant is always expanded, so mark seen on mount.
  useEffect(() => {
    if (variant !== "inline" || notifications.length === 0) return;
    setSeenBaseline((current) => current || lastSeen);
    markAllSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, notifications.length]);

  const formatDate = useCallback(
    (value: string | null) => {
      if (!value) return "";
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return value;
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parsed);
    },
    [locale]
  );

  const describe = useCallback(
    (item: AppNotification) => {
      const person = item.personName ?? t("someone");
      const tour = item.tourTitle ?? t("aTour");

      switch (item.kind) {
        case "reservation_request":
          return {
            title: t("request.title"),
            body: t("request.body", {
              person,
              party: item.partySize ?? 1,
              tour,
            }),
          };
        case "reservation_pending":
          return {
            title: t("pending.title"),
            body: t("pending.body", { guide: person, tour }),
          };
        case "reservation_confirmed":
          return {
            title: t("confirmed.title"),
            body: t("confirmed.body", { guide: person, tour }),
          };
        case "reservation_declined":
          return {
            title: t("declined.title"),
            body: t("declined.body", { guide: person, tour }),
          };
        case "guide_application":
          if (item.status === "accepted") {
            return {
              title: t("application.acceptedTitle"),
              body: t("application.acceptedBody"),
            };
          }
          if (item.status === "rejected") {
            return {
              title: t("application.rejectedTitle"),
              body: t("application.rejectedBody"),
            };
          }
          return {
            title: t("application.pendingTitle"),
            body: t("application.pendingBody"),
          };
        default:
          return { title: t("title"), body: "" };
      }
    },
    [t]
  );

  const list = (
    <ul className="divide-y">
      {notifications.map((item) => {
        const { title, body } = describe(item);
        const Icon = iconFor(item.kind, item.status);
        const isNew = !seenBaseline || item.timestamp > seenBaseline;

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className={cn(
                "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                isNew && "bg-primary/5"
              )}
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{title}</span>
                  {isNew ? (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-primary"
                      aria-label={t("new")}
                    />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{body}</p>
                {item.date ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("on", { date: formatDate(item.date) })}
                  </p>
                ) : null}
                {item.kind === "reservation_confirmed" ? (
                  <a
                    href={`/api/reservations/${item.id.replace(
                      /^booking:/,
                      ""
                    )}/calendar`}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <CalendarPlus className="size-3.5" />
                    {t("addToCalendar")}
                  </a>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const emptyState = (
    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
      {t("empty")}
    </div>
  );

  if (variant === "inline") {
    return (
      <div className={cn("rounded-xl border", className)}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">{t("title")}</span>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </div>
        {notifications.length === 0 ? emptyState : list}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("open")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => (isOpen ? setIsOpen(false) : openPanel())}
      >
        <span className="relative inline-flex">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </span>
      </Button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={t("title")}
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover shadow-lg"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">{t("title")}</span>
            <span className="text-xs text-muted-foreground">
              {t("count", { count: notifications.length })}
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? emptyState : list}
          </div>
        </div>
      ) : null}
    </div>
  );
}
