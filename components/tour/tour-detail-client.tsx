'use client'

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  createReservationAction,
  type ReservationErrorCode,
} from "@/lib/actions/reservation-actions";

import { useTranslations } from "next-intl";

import { PageShell } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Tour, TourCategory } from "@/lib/types/tour";
import type { Review } from "@/lib/types/review";
import { formatMoney } from "@/lib/format/money";
import { getInitials } from "@/lib/guide/get-initials";
import { usablePhoto } from "@/lib/media/usable-photo";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  Languages,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";

type TourAvailabilityDay = {
  date: string;
  availableSpots: number;
};

/** The guide's own words, as shown on their public profile. */
export type GuideStory = {
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  homeBase: string | null;
  tourCount: number;
};

/** Another tour the same guide runs. */
export type GuideTour = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string;
  location: string | null;
  country: string | null;
  duration: string | null;
  price: number | null;
};

type Props = {
  locale: string;
  tour: Tour;
  similarTours: Tour[];
  reviews: Review[];
  guideStory?: GuideStory | null;
  guideTours?: GuideTour[];
};

const BROWSE_CATEGORIES: TourCategory[] = [
  "food",
  "nature",
  "culture",
  "adventure",
  "history",
];

function formatLocalISODate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function joinPlace(location: string | null, country: string | null) {
  return [location, country]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

/** Small-caps label that opens each section, as on the rest of the site. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-deep">
      {children}
    </p>
  );
}

function Stars({ rating, label }: { rating: number; label: string }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < rounded
              ? "size-3.5 fill-primary text-primary"
              : "size-3.5 text-muted-foreground/40"
          }
        />
      ))}
    </span>
  );
}

/**
 * "Vodi — <name>": the attribution line that carries the page.
 *
 * Sits directly under the title rather than in a card halfway down, because the
 * person is what a traveller is choosing here.
 */
function GuideByline({
  avatar,
  name,
  verified,
  label,
  href,
  compact = false,
}: {
  avatar: string | null;
  name: string;
  verified: boolean;
  label: string;
  href?: string | null;
  compact?: boolean;
}) {
  const body = (
    <>
      <Avatar
        className={`${
          compact ? "size-7" : "size-11"
        } ring-2 ring-primary/15 ring-offset-2 ring-offset-background`}
      >
        <AvatarImage src={usablePhoto(avatar) ?? undefined} alt={name} />
        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {compact ? (
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <span className="truncate">
            {label} <span className="font-medium text-foreground">{name}</span>
          </span>
          {verified ? (
            <BadgeCheck className="size-3.5 shrink-0 text-primary" />
          ) : null}
        </span>
      ) : (
        <span className="text-sm">
          <span className="block text-muted-foreground">{label}</span>
          <span className="flex items-center gap-1.5 font-medium">
            {name}
            {verified ? (
              <BadgeCheck className="size-4 shrink-0 text-primary" />
            ) : null}
          </span>
        </span>
      )}
    </>
  );

  if (!href) {
    return <span className="inline-flex items-center gap-3">{body}</span>;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 transition-colors hover:text-primary"
    >
      {body}
    </Link>
  );
}

export default function TourDetailClient({
  locale,
  tour,
  similarTours,
  reviews,
  guideStory = null,
  guideTours = [],
}: Props) {
  const tBooking = useTranslations("Booking");
  const t = useTranslations("Tour");

  // A score with no reviews behind it is not a rating — tours seeded with a
  // default rating would otherwise advertise one.
  const hasReviews = tour.reviewCount > 0;

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(1);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, number>
  >({});
  /** Bumped after a successful booking to re-read availability. */
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const [bookingError, setBookingError] = useState<ReservationErrorCode | null>(
    null
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isBooking, startBooking] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setSelectedDate("");
    setGuestCount(1);
    setAvailabilityByDate({});
    setAvailabilityStatus("idle");
    setBookingError(null);
    setBookingConfirmed(false);
  }, [tour.id]);

  const formatPrice = useCallback(
    (amount: number) => formatMoney(locale, amount),
    [locale]
  );

  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );

  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short" }),
    [locale]
  );

  const longDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "long" }),
    [locale]
  );

  const todayLocalISO = useMemo(() => formatLocalISODate(new Date()), []);
  const availabilityEndLocalISO = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + 180);
    return formatLocalISODate(end);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAvailability() {
      setAvailabilityStatus("loading");
      try {
        const res = await fetch(
          `/api/tours/${tour.id}/availability?start=${todayLocalISO}&end=${availabilityEndLocalISO}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(`Availability request failed: ${res.status}`);
        }
        const days = (await res.json()) as TourAvailabilityDay[];
        const next: Record<string, number> = {};
        for (const day of days) {
          if (typeof day?.date === "string") {
            next[day.date] = Math.max(0, Number(day.availableSpots) || 0);
          }
        }
        setAvailabilityByDate(next);
        setAvailabilityStatus("loaded");
      } catch (error) {
        if ((error as { name?: string } | null)?.name === "AbortError") return;
        setAvailabilityByDate({});
        setAvailabilityStatus("error");
      }
    }

    loadAvailability();
    return () => controller.abort();
  }, [availabilityEndLocalISO, todayLocalISO, tour.id, availabilityRefresh]);

  const handleBooking = () => {
    if (!selectedDate || isBooking) return;

    setBookingError(null);
    setBookingConfirmed(false);

    startBooking(async () => {
      const result = await createReservationAction({
        tourId: tour.id,
        date: selectedDate,
        guests: guestCount,
        locale,
      });

      if (result.ok) {
        setBookingConfirmed(true);
        setAvailabilityRefresh((current) => current + 1);
        return;
      }

      if (result.code === "SIGN_IN_REQUIRED") {
        const query = new URLSearchParams();
        query.set("next", `/${locale}/tour/${tour.id}`);
        query.set("message", AuthFlashMessage.SignInToBook);
        router.push(`/${locale}/auth/sign-in?${query.toString()}`);
        return;
      }

      setBookingError(result.code);
      // The date may have filled up while the form sat open.
      setAvailabilityRefresh((current) => current + 1);
    });
  };

  const bookingErrorMessage =
    bookingError && t.has(`bookingErrors.${bookingError}`)
      ? t(`bookingErrors.${bookingError}`)
      : null;

  const maxGuests = (() => {
    const match = tour.groupSize.match(/\d+/);
    const parsed = match ? Number.parseInt(match[0], 10) : Number.NaN;
    if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 1) return 10;
    return Math.min(parsed, 50);
  })();

  /**
   * Dates the guide has actually opened, in order. A tour only runs on the days
   * it has an availability row, so everything else is "not offered" rather than
   * sold out — the two look identical in the raw lookup and must not be
   * reported the same way.
   */
  const openDates = useMemo(
    () =>
      Object.entries(availabilityByDate)
        .filter(([, spots]) => spots > 0)
        .map(([date]) => date)
        .sort(),
    [availabilityByDate]
  );

  const isDateOffered =
    Boolean(selectedDate) &&
    Object.prototype.hasOwnProperty.call(availabilityByDate, selectedDate);

  const availableSpotsForSelectedDate =
    availabilityStatus === "loaded" && selectedDate && isDateOffered
      ? availabilityByDate[selectedDate]
      : undefined;

  const spotsForSelectedDate = availableSpotsForSelectedDate ?? 0;

  const maxGuestsForSelectedDate =
    selectedDate && availabilityStatus === "loaded"
      ? Math.min(maxGuests, spotsForSelectedDate)
      : maxGuests;

  const guestStepperCap =
    selectedDate && availabilityStatus === "loaded"
      ? Math.max(1, maxGuestsForSelectedDate)
      : maxGuests;

  useEffect(() => {
    if (!selectedDate || availabilityStatus !== "loaded") return;

    setGuestCount((current) => Math.min(current, guestStepperCap));
  }, [availabilityStatus, guestStepperCap, selectedDate]);

  const totalPrice = Math.max(0, tour.price) * guestCount;

  const isBookingDisabled =
    !selectedDate ||
    availabilityStatus !== "loaded" ||
    spotsForSelectedDate < guestCount;

  const categoryLabel = (category: TourCategory | string) =>
    t.has(`categories.${category}`) ? t(`categories.${category}`) : category;

  const guideName = tour.guide.name;
  const guideFirstName = guideName.split(/\s+/)[0] || guideName;
  const guideHref = tour.guide.id ? `/${locale}/guides/${tour.guide.id}` : null;
  const guidePhoto = usablePhoto(tour.guide.avatar);
  const tourPhoto = usablePhoto(tour.image);
  const languagesLabel = tour.guide.languages.join(" · ");
  const place = joinPlace(tour.location, tour.country);
  const starsLabel = (value: number) =>
    t("starsAria", { rating: value.toFixed(1) });

  const metaBits = [tour.duration, tour.groupSize, languagesLabel].filter(
    Boolean
  );

  const included = [
    ...tour.highlights,
    t("includedGuide"),
    t("includedSmallGroup"),
  ];

  const selectedDateLabel = selectedDate
    ? longDateFormatter.format(new Date(`${selectedDate}T00:00:00`))
    : null;

  const availabilityNote = !selectedDate
    ? availabilityStatus === "loaded" && openDates.length === 0
      ? t("noOpenDates")
      : t("selectDateHint")
    : availabilityStatus === "loading"
      ? t("checkingAvailability")
      : availabilityStatus === "error"
        ? t("availabilityLoadFailed")
        : !isDateOffered
          ? t("notOfferedHint")
          : spotsForSelectedDate === 0
            ? t("fullyBookedHint")
            : spotsForSelectedDate < guestCount
              ? t("onlySpotsLeft", { count: spotsForSelectedDate })
              : t("spotsAvailable", { count: spotsForSelectedDate });

  const availabilityNoteIsProblem =
    availabilityStatus === "error" ||
    (availabilityStatus === "loaded" &&
      Boolean(selectedDate) &&
      spotsForSelectedDate === 0);

  return (
    <PageShell variant="full">
      {/* ── Masthead: the guide's name sits above the price ─────────────── */}
      <section className="border-b">
        <div className="container py-8 md:py-12">
          <nav
            aria-label={t("breadcrumbAria")}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
          >
            <Link
              href={`/${locale}/browse`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              {t("backToBrowse")}
            </Link>
            <span aria-hidden="true" className="text-muted-foreground/50">
              /
            </span>
            <Link
              href={`/${locale}/browse?interest=${tour.category}`}
              className="transition-colors hover:text-foreground"
            >
              {categoryLabel(tour.category)}
            </Link>
            <span aria-hidden="true" className="text-muted-foreground/50">
              /
            </span>
            <span className="text-foreground">{tour.location}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
            <div className="space-y-5">
              <Eyebrow>
                {t("mastheadEyebrow", {
                  category: categoryLabel(tour.category),
                  location: tour.location,
                })}
              </Eyebrow>

              <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                {tour.title}
              </h1>

              <GuideByline
                avatar={tour.guide.avatar}
                name={guideName}
                verified={tour.guide.verified}
                href={guideHref}
                label={t("hostedBy")}
              />

              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {place}
                </span>
                {metaBits.map((bit) => (
                  <span key={bit} className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-muted-foreground/50">
                      ·
                    </span>
                    {bit}
                  </span>
                ))}
              </p>
            </div>

            {/* The price is stated once, plainly — no glowing conversion box. */}
            <div className="flex flex-col gap-3 lg:items-end lg:text-right">
              <div>
                <div className="text-3xl font-semibold tracking-tight">
                  {formatPrice(tour.price)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("perPersonPlain")}
                </div>
              </div>

              {hasReviews ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Stars rating={tour.rating} label={starsLabel(tour.rating)} />
                  {tour.rating.toFixed(1)}
                  <span>{t("reviewCountPlain", { count: tour.reviewCount })}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
              )}

              <Button asChild variant="outline" className="w-fit">
                <a href="#ask">
                  {t("seeOpenDays")}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── One wide photograph instead of a scattered collage ──────────── */}
      {tourPhoto ? (
        <section className="container pt-8 md:pt-10">
          {/* Capped, so the photograph never pushes the guide below the fold. */}
          <div className="relative aspect-16/9 max-h-[480px] overflow-hidden rounded-2xl border bg-muted">
            <Image
              src={tourPhoto}
              alt={tour.title}
              fill
              className="object-cover"
              priority
              sizes="(min-width: 1280px) 1200px, 100vw"
            />
          </div>
        </section>
      ) : null}

      {/* ── The guide: the centre of the page, not a card halfway down ──── */}
      <section className="mt-8 border-y bg-muted/20 md:mt-10">
        <div className="container py-14 md:py-20">
          <Eyebrow>{t("guideEyebrow")}</Eyebrow>

          <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-12">
            <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border bg-card">
              {guidePhoto ? (
                <Image
                  src={guidePhoto}
                  alt={guideName}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-accent text-4xl font-semibold text-accent-foreground">
                  {getInitials(guideName)}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {guideName}
                  </h2>
                  {tour.guide.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <BadgeCheck className="size-3.5" />
                      {t("verified")}
                    </span>
                  ) : null}
                </div>
                {guideStory?.headline ? (
                  <p className="text-lg text-muted-foreground">
                    {guideStory.headline}
                  </p>
                ) : null}
              </div>

              {/* The guide's own words, or nothing — never invented for them. */}
              {guideStory?.bio ? (
                <p className="max-w-2xl whitespace-pre-line text-base leading-relaxed md:text-lg">
                  {guideStory.bio}
                </p>
              ) : (
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {t("guideNoBio")}
                </p>
              )}

              <dl className="grid max-w-2xl gap-x-8 gap-y-4 border-t pt-6 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">
                    {t("guideExperienceLabel")}
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {guideStory?.yearsExperience != null
                      ? t("guideExperienceYears", {
                          count: guideStory.yearsExperience,
                        })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("languagesLabel")}</dt>
                  <dd className="mt-0.5 font-medium">{languagesLabel || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("guideToursLabel")}</dt>
                  <dd className="mt-0.5 font-medium">
                    {guideStory?.tourCount
                      ? t("guideToursCount", { count: guideStory.tourCount })
                      : "—"}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-3">
                {guideHref ? (
                  <Button asChild variant="outline">
                    <Link href={guideHref}>
                      {t("fullProfile")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button variant="ghost">
                  <MessageCircle className="size-4" />
                  {t("messageGuide", { name: guideFirstName })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What the tour actually is, set as prose with a margin note ──── */}
      <section className="container py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,240px)] lg:gap-16">
          <div className="space-y-12">
            <div className="space-y-4">
              <Eyebrow>{t("aboutEyebrow")}</Eyebrow>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("aboutTitle")}
              </h2>
              <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                {tour.description}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {t("includedTitle")}
              </h3>
              <ul className="max-w-2xl border-y">
                {included.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-start gap-3 py-3.5 [&:not(:last-child)]:border-b"
                  >
                    <Check className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:pt-10">
            <dl className="space-y-5 border-t pt-6 text-sm lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" />
                  {t("durationLabel")}
                </dt>
                <dd className="mt-0.5 font-medium">{tour.duration || "—"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5" />
                  {t("groupSizeLabel")}
                </dt>
                <dd className="mt-0.5 font-medium">{tour.groupSize || "—"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Languages className="size-3.5" />
                  {t("languagesLabel")}
                </dt>
                <dd className="mt-0.5 font-medium">{languagesLabel || "—"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {t("placeLabel")}
                </dt>
                <dd className="mt-0.5 font-medium">{place || "—"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* ── Ask to join: a request sent to a person, not a checkout ─────── */}
      <section id="ask" className="scroll-mt-20 border-y bg-muted/20">
        <div className="container py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-16">
            <div className="space-y-6">
              <Eyebrow>{t("askEyebrow")}</Eyebrow>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("askTitle", { name: guideFirstName })}
              </h2>
              <p className="max-w-xl text-muted-foreground">{t("askNote")}</p>

              <div className="space-y-3">
                <p className="text-sm font-medium">{t("openDaysTitle")}</p>

                {availabilityStatus === "loading" ||
                availabilityStatus === "idle" ? (
                  <p className="text-sm text-muted-foreground">
                    {t("checkingAvailability")}
                  </p>
                ) : availabilityStatus === "error" ? (
                  <p className="text-sm text-destructive">
                    {t("availabilityLoadFailed")}
                  </p>
                ) : openDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("noOpenDates")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {openDates.slice(0, 12).map((date) => {
                      const parsed = new Date(`${date}T00:00:00`);
                      const isSelected = date === selectedDate;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          aria-pressed={isSelected}
                          className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-card hover:border-primary/50"
                          }`}
                        >
                          <span className="block text-[11px] uppercase tracking-wider opacity-70">
                            {weekdayFormatter.format(parsed)}
                          </span>
                          <span className="block text-sm font-medium">
                            {shortDateFormatter.format(parsed)}
                          </span>
                          <span className="block text-[11px] opacity-70">
                            {t("spotsShort", { count: availabilityByDate[date] })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="h-fit space-y-5 rounded-2xl border bg-card p-6">
              <div className="space-y-2">
                <label
                  htmlFor="tour-date"
                  className="text-sm font-medium text-muted-foreground"
                >
                  {t("selectDateLabel")}
                </label>
                <Input
                  id="tour-date"
                  type="date"
                  min={todayLocalISO}
                  max={
                    openDates.length > 0
                      ? openDates[openDates.length - 1]
                      : undefined
                  }
                  list="tour-open-dates"
                  className="h-11 w-full bg-background"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
                <datalist id="tour-open-dates">
                  {openDates.map((date) => (
                    <option key={date} value={date} />
                  ))}
                </datalist>
                <p
                  className={`text-xs ${
                    availabilityNoteIsProblem
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {availabilityNote}
                </p>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-muted-foreground">
                  {t("guestsLabel")}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-lg"
                    onClick={() =>
                      setGuestCount((current) => Math.max(1, current - 1))
                    }
                    disabled={guestCount <= 1}
                    aria-label={t("decreaseGuests")}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <div className="flex h-10 flex-1 items-center justify-between rounded-md border bg-background px-3 text-sm">
                    <span className="font-medium">
                      {t("guests", { count: guestCount })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedDate && availabilityStatus === "loaded"
                        ? maxGuestsForSelectedDate > 0
                          ? t("maxGuests", { count: maxGuestsForSelectedDate })
                          : isDateOffered
                            ? t("fullyBooked")
                            : t("notOffered")
                        : t("maxGuests", { count: maxGuests })}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    onClick={() =>
                      setGuestCount((current) =>
                        Math.min(guestStepperCap, current + 1)
                      )
                    }
                    disabled={guestCount >= guestStepperCap}
                    aria-label={t("increaseGuests")}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4 text-sm">
                {selectedDateLabel ? (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">{t("dayLabel")}</span>
                    <span className="text-right font-medium">
                      {selectedDateLabel}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t("priceTimesGuests", {
                      price: formatPrice(tour.price),
                      count: guestCount,
                    })}
                  </span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-base font-semibold">
                  <span>{t("total")}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button
                className="h-11 w-full"
                onClick={handleBooking}
                disabled={isBookingDisabled || isBooking}
              >
                {isBooking
                  ? t("sendingRequest")
                  : !selectedDate
                    ? t("selectDateCta")
                    : availabilityStatus !== "loaded"
                      ? t("checkingAvailability")
                      : !isDateOffered
                        ? t("notAvailableCta")
                        : spotsForSelectedDate === 0
                          ? t("fullyBooked")
                          : spotsForSelectedDate < guestCount
                            ? t("notEnoughSpots")
                            : t("askCta", { name: guideFirstName })}
              </Button>

              {bookingErrorMessage ? (
                <p className="text-center text-xs text-destructive">
                  {bookingErrorMessage}
                </p>
              ) : null}

              <p className="text-center text-xs text-muted-foreground">
                {t("freeCancellation")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Afterwards: travellers in their own words, not a score board ── */}
      <section className="container py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-16">
          <div className="md:sticky md:top-24 md:h-fit">
            <Eyebrow>{t("reviewsEyebrow")}</Eyebrow>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {t("reviewsTitle")}
            </h2>
            {hasReviews ? (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Stars rating={tour.rating} label={starsLabel(tour.rating)} />
                {tour.rating.toFixed(1)} ·{" "}
                {t("reviewCountPlain", { count: tour.reviewCount })}
              </p>
            ) : null}
          </div>

          <div>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <figure
                  key={review.id}
                  className="space-y-4 py-8 first:pt-0 [&:not(:last-child)]:border-b"
                >
                  <blockquote className="max-w-2xl text-pretty text-lg leading-relaxed">
                    {t("quote", { text: review.comment })}
                  </blockquote>
                  <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                    <Avatar className="size-9">
                      <AvatarImage
                        src={usablePhoto(review.avatar) ?? undefined}
                        alt={review.author}
                      />
                      <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                        {getInitials(review.author)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {review.author}
                    </span>
                    <span aria-hidden="true" className="text-muted-foreground/50">
                      ·
                    </span>
                    <span>
                      {new Date(review.date).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                    <Stars
                      rating={review.rating}
                      label={starsLabel(review.rating)}
                    />
                  </figcaption>
                </figure>
              ))
            ) : (
              <p className="text-muted-foreground">{t("reviewsEmpty")}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Keep wandering: the guide first, then sideways, then anywhere ─ */}
      <section className="border-t bg-muted/20">
        <div className="container space-y-14 py-14 md:py-20">
          {guideTours.length > 0 ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow>{t("wanderEyebrow")}</Eyebrow>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                    {t("moreWithGuide", { name: guideName })}
                  </h2>
                </div>
                {guideHref ? (
                  <Link
                    href={guideHref}
                    className="text-sm underline underline-offset-4 transition-colors hover:text-primary"
                  >
                    {t("seeProfile")}
                  </Link>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-2xl border bg-card">
                {guideTours.map((guideTour) => (
                  <Link
                    key={guideTour.id}
                    href={`/${locale}/tour/${guideTour.id}`}
                    className="group flex flex-col gap-4 p-5 transition-colors hover:bg-muted/30 sm:flex-row [&:not(:last-child)]:border-b"
                  >
                    {usablePhoto(guideTour.image) ? (
                      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28 sm:aspect-auto">
                        <Image
                          src={usablePhoto(guideTour.image) as string}
                          alt={guideTour.title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 640px) 112px, 100vw"
                        />
                      </div>
                    ) : null}

                    <div className="min-w-0 space-y-1.5">
                      <div className="font-medium leading-snug transition-colors group-hover:text-primary">
                        {guideTour.title}
                      </div>
                      {guideTour.description ? (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {guideTour.description}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {[
                          categoryLabel(guideTour.category),
                          guideTour.duration,
                          joinPlace(guideTour.location, guideTour.country),
                          guideTour.price !== null
                            ? t("perPersonPrice", {
                                price: formatPrice(guideTour.price),
                              })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {similarTours.length > 0 ? (
            <div className="space-y-5">
              <div>
                <Eyebrow>{t("elsewhereEyebrow")}</Eyebrow>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  {t("otherToursTitle")}
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {similarTours.slice(0, 3).map((similar) => {
                  const photo = usablePhoto(similar.image);
                  return (
                  <Link
                    key={similar.id}
                    href={`/${locale}/tour/${similar.id}`}
                    className="group overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/50"
                  >
                    <div className="relative aspect-4/3 bg-muted">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={similar.title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-3 p-5">
                      <h3 className="line-clamp-2 font-medium leading-snug transition-colors group-hover:text-primary">
                        {similar.title}
                      </h3>
                      <GuideByline
                        avatar={similar.guide.avatar}
                        name={similar.guide.name}
                        verified={similar.guide.verified}
                        label={t("hostedBy")}
                        compact
                      />
                      <div className="flex items-center justify-between pt-1 text-sm">
                        <span className="text-muted-foreground">
                          {similar.location}
                        </span>
                        <span className="font-medium">
                          {formatPrice(similar.price)}
                        </span>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* No dead end at the bottom of a tour: wander in any direction. */}
          <div className="space-y-4 border-t pt-8">
            <p className="text-sm text-muted-foreground">{t("wanderPrompt")}</p>
            <div className="flex flex-wrap items-center gap-2">
              {BROWSE_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  href={`/${locale}/browse?interest=${category}`}
                  className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {categoryLabel(category)}
                </Link>
              ))}
              <Link
                href={`/${locale}/browse`}
                className="inline-flex items-center gap-1.5 px-2 py-2 text-sm underline underline-offset-4 transition-colors hover:text-primary"
              >
                {t("browseAllGuides")}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={bookingConfirmed} onOpenChange={setBookingConfirmed}>
        <DialogContent className="max-w-sm text-center sm:max-w-md">
          <DialogHeader className="items-center gap-3">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-12 text-primary" strokeWidth={2.2} />
            </div>
            <DialogTitle className="text-2xl">
              {tBooking("sentTitle")}
            </DialogTitle>
            <DialogDescription className="text-balance">
              {tBooking("sentBody", { guide: tour.guide.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              className="w-full sm:w-40"
              onClick={() => setBookingConfirmed(false)}
            >
              {tBooking("sentAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
