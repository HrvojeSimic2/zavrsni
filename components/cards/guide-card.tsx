import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { GuideBrowseItem } from "@/lib/types/guide";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Languages,
  MapPin,
  Star,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatHourlyRate } from "@/lib/format/money";

const MAX_INTERESTS = 3;

function getInitials(name: string) {
  const parts = String(name ?? "")
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

export function GuideCard({ guide }: { guide: GuideBrowseItem }) {
  const t = useTranslations("GuideCard");
  const tInterests = useTranslations("Home.interests");
  const locale = useLocale();

  // One quiet fact among others: the rate is per hour of their time, and it
  // does not change with how many people come along.
  const rateLabel = formatHourlyRate(locale, guide.hourlyRate);

  const languagesLabel =
    guide.languages.length > 0 ? guide.languages.join(" · ") : "—";

  const nextLabel =
    guide.nextAvailableDate && !guide.availableToday
      ? t("nextAvailable", { date: guide.nextAvailableDate })
      : null;

  // Only surface a score once it is backed by actual reviews — an average with
  // no reviews behind it is not a rating.
  const hasRating = guide.reviewCount > 0;

  const shownInterests = guide.interests.slice(0, MAX_INTERESTS);
  const hiddenInterests = guide.interests.length - shownInterests.length;

  return (
    <Card className="group relative h-full flex flex-col gap-0 overflow-hidden rounded-2xl py-0 transition-colors duration-200 hover:border-primary/50">
      {/* Brand hairline that lights up on hover — colour only, so nothing shifts. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-secondary to-primary/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-14 w-14 ring-2 ring-primary/15 ring-offset-2 ring-offset-card">
              <AvatarImage src={guide.avatar ?? undefined} alt={guide.name} />
              <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                {getInitials(guide.name)}
              </AvatarFallback>
            </Avatar>
            {guide.verified ? (
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                <BadgeCheck
                  className="h-4.5 w-4.5 text-primary"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("verified")}</span>
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <Link
              href={`/guides/${guide.id}`}
              className="block truncate font-semibold text-lg leading-tight hover:text-primary transition-colors duration-200"
            >
              {guide.name}
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{guide.location}</span>
            </div>
            {guide.availableToday ? (
              <Badge
                variant="outline"
                className="mt-1.5 max-w-full border-secondary/40 bg-secondary/15 text-secondary-foreground font-normal"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-foreground/70"
                  aria-hidden="true"
                />
                <span className="truncate">{t("availableToday")}</span>
              </Badge>
            ) : null}
          </div>

          {/* Rating sits in the header so the footer CTA never has to share a
              row with a pluralised review count that can outgrow the card. */}
          {hasRating ? (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-sm font-semibold text-foreground">
                <Star
                  className="h-3.5 w-3.5 fill-primary text-primary"
                  aria-hidden="true"
                />
                {guide.rating.toFixed(1)}
              </span>
              <span className="whitespace-nowrap text-[11px] leading-none text-muted-foreground">
                {t("reviewCount", { count: guide.reviewCount })}
              </span>
            </div>
          ) : null}
        </div>

        {shownInterests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {shownInterests.map((interest) => (
              <Badge
                key={interest}
                variant="outline"
                className="max-w-full font-normal text-muted-foreground"
              >
                <span className="truncate">{tInterests(interest)}</span>
              </Badge>
            ))}
            {hiddenInterests > 0 ? (
              <Badge
                variant="outline"
                className="font-normal text-muted-foreground"
              >
                +{hiddenInterests}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <dl className="mt-auto space-y-2 rounded-xl bg-muted/40 p-3 text-sm">
          <div className="flex items-start gap-2">
            <dt className="shrink-0 pt-0.5">
              <Languages
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="sr-only">{t("languages")}</span>
            </dt>
            <dd className="min-w-0 line-clamp-2">{languagesLabel}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="shrink-0 pt-0.5">
              <Wallet
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="sr-only">{t("rate")}</span>
            </dt>
            <dd className="min-w-0">
              {rateLabel ? t("rateFrom", { rate: rateLabel }) : t("rateOnRequest")}
            </dd>
          </div>
          {nextLabel ? (
            <div className="flex items-start gap-2 text-muted-foreground">
              <dt className="shrink-0 pt-0.5">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
              </dt>
              <dd className="min-w-0 line-clamp-2">{nextLabel}</dd>
            </div>
          ) : null}
          {!hasRating ? (
            <div className="flex items-start gap-2 text-muted-foreground">
              <dt className="shrink-0 pt-0.5">
                <Star className="h-4 w-4" aria-hidden="true" />
              </dt>
              <dd className="min-w-0">{t("noReviews")}</dd>
            </div>
          ) : null}
        </dl>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button asChild className="w-full">
          <Link href={`/guides/${guide.id}`}>
            {t("view")}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
