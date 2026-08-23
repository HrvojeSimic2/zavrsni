"use client";

import { useEffect, useMemo, useState } from "react";
import type { GuideBrowseItem } from "@/lib/types/guide";
import { Button } from "@/components/ui/button";
import { GuideCard } from "@/components/cards/guide-card";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type Props = {
  guides: GuideBrowseItem[];
};

function safeReadLocation(): string {
  try {
    return String(localStorage.getItem("pg.where") ?? "").trim();
  } catch {
    return "";
  }
}

type ListingSectionProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  guides: GuideBrowseItem[];
};

function ListingSection({
  title,
  description,
  actionLabel,
  actionHref,
  guides,
}: ListingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>
    </div>
  );
}

export function GuideSpotlight({ guides }: Props) {
  const t = useTranslations("Home.spotlight");
  const [where, setWhere] = useState<string>("");

  useEffect(() => {
    setWhere(safeReadLocation());
  }, []);

  const nearYou = useMemo(() => {
    const needle = where.trim().toLowerCase();
    if (!needle) return [];
    return guides
      .filter((guide) => guide.location.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [guides, where]);

  const availableToday = useMemo(
    () => guides.filter((guide) => guide.availableToday).slice(0, 6),
    [guides]
  );

  const featured = useMemo(() => guides.slice(0, 6), [guides]);

  // Prefer location-matched guides; otherwise lead with the top-rated ones so
  // the section never renders as an empty placeholder.
  const primary =
    nearYou.length > 0
      ? {
          title: t("nearTitle", { location: where.trim() }),
          description: t("nearDescription"),
          actionHref: `/browse?where=${encodeURIComponent(where.trim())}`,
          guides: nearYou,
        }
      : {
          title: t("featuredTitle"),
          description: t("featuredDescription"),
          actionHref: "/browse",
          guides: featured,
        };

  if (primary.guides.length === 0 && availableToday.length === 0) return null;

  return (
    <section className="border-b py-16 md:py-24">
      <div className="container space-y-16">
        {primary.guides.length > 0 ? (
          <ListingSection
            title={primary.title}
            description={primary.description}
            actionLabel={t("seeAll")}
            actionHref={primary.actionHref}
            guides={primary.guides}
          />
        ) : null}

        {availableToday.length > 0 ? (
          <ListingSection
            title={t("availableTitle")}
            description={t("availableDescription")}
            actionLabel={t("seeAvailable")}
            actionHref="/browse?available=today"
            guides={availableToday}
          />
        ) : null}
      </div>
    </section>
  );
}
