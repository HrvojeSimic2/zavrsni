import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import type { ComponentType } from "react";

type ItemKey =
  | "overview"
  | "schedule"
  | "events"
  | "reservations"
  | "profile";

type Props = {
  active: ItemKey;
};

const items: Array<{
  key: ItemKey;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "overview", href: "/guide", icon: LayoutDashboard },
  { key: "schedule", href: "/guide/schedule", icon: CalendarClock },
  { key: "events", href: "/guide/events", icon: CalendarDays },
  { key: "reservations", href: "/guide/reservations", icon: ClipboardList },
  { key: "profile", href: "/guide/profile", icon: UserRound },
];

export async function GuideDashboardNav({ active }: Props) {
  const t = await getTranslations("GuideDashboard.nav");

  return (
    <nav
      aria-label={t("aria")}
      className="flex flex-wrap items-center gap-1 rounded-xl border bg-muted/20 p-1"
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            item.key === active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
          )}
        >
          <item.icon className="size-4" />
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
