import { PageShell } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { fetchGuideProfile } from "@/lib/services/guide-service";
import { getInitials } from "@/lib/guide/get-initials";
import { formatScheduleDate } from "@/lib/guide/reservation-status";
import { formatHourlyRate } from "@/lib/format/money";
import { usablePhoto } from "@/lib/media/usable-photo";
import { GuideBookingPanel } from "@/components/guide/guide-booking-panel";
import {
  fetchConfirmedBookingWithGuide,
  fetchGuideContact,
  isGuideOwner,
} from "@/lib/guide/booking-access";
import {
  CalendarPlus,
  CheckCircle2,
  Globe,
  Lock,
  MapPin,
  Star,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthFlashMessage } from "@/lib/i18n/auth-flash";

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

export const dynamic = "force-dynamic";

export default async function GuideProfilePage({
  params,
}: {
  params:
    | { locale: string; guideId: string }
    | Promise<{ locale: string; guideId: string }>;
}) {
  const { locale, guideId } = await Promise.resolve(params);
  const t = await getTranslations("GuideProfile");
  const starsLabel = (value: number) =>
    t("starsAria", { rating: value.toFixed(1) });

  const {
    guide: guideRow,
    interests,
    rating,
    reviewCount,
    hourlyRate,
    maxGroupSize,
    availableToday,
    nextAvailableDate,
    slots,
    reviews,
  } = await fetchGuideProfile(guideId);

  if (!guideRow) notFound();

  const languages = guideRow.languages ?? [];
  const languagesLabel =
    languages.length > 0 ? languages.join(" · ") : t("empty");
  const yearsExperience = guideRow.years_experience ?? null;
  const rateLabel = formatHourlyRate(locale, hourlyRate);

  // Taken slots stay out of the picker; the schedule is the guide's business.
  const openSlots = slots.filter((slot) => !slot.booked);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [isOwnProfile, confirmedBooking] = await Promise.all([
    isGuideOwner(supabase, user, guideId),
    fetchConfirmedBookingWithGuide(supabase, user, guideId),
  ]);

  // Contact details are earned by a confirmed booking, not by signing up.
  const canSeeContact = isOwnProfile || confirmedBooking !== null;

  // Only now, once access is established, are the contact columns read at all.
  const contact = canSeeContact
    ? await fetchGuideContact(supabase, guideId)
    : { email: null, phone: null };

  const guide = { ...guideRow, ...contact };
  const firstName = guide.name.split(/\s+/)[0];

  const signInQuery = new URLSearchParams();
  signInQuery.set("next", `/${locale}/guides/${guideId}`);
  signInQuery.set("message", AuthFlashMessage.SignInToConnect);
  const signInHref = `/auth/sign-in?${signInQuery.toString()}`;

  return (
    <PageShell variant="contained" contentClassName="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <Avatar className="h-20 w-20">
            <AvatarImage src={usablePhoto(guide.avatar) ?? undefined} alt={guide.name} />
            <AvatarFallback>{getInitials(guide.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl font-semibold leading-tight truncate">
              {guide.name}
            </h1>
            {guide.headline ? (
              <p className="text-sm text-muted-foreground">{guide.headline}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {guide.location ?? t("empty")}
              </span>
              {reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Stars rating={rating} label={starsLabel(rating)} />
                  {rating.toFixed(1)} ({reviewCount})
                </span>
              ) : null}
              {guide.verified ? (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {t("verified")}
                </Badge>
              ) : null}
              {availableToday ? (
                <Badge className="bg-secondary/15 text-secondary border-secondary/30">
                  {t("availableToday")}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwnProfile ? (
            <Button asChild variant="outline">
              <Link href="/guide/profile">{t("editProfile")}</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/browse">{t("findAnother")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {guide.bio ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("aboutTitle", { name: firstName })}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {guide.bio}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t("strengthsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {interests.length > 0 ? (
                  interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="rounded-full"
                    >
                      {t.has(`interests.${interest}`)
                        ? t(`interests.${interest}`)
                        : interest}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="rounded-full">
                    {t("fullyCustomizable")}
                  </Badge>
                )}
              </div>

              <Separator />

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t("languagesLabel")}</dt>
                  <dd className="font-medium">{languagesLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("experienceLabel")}</dt>
                  <dd className="font-medium">
                    {yearsExperience !== null
                      ? t("experienceYears", { count: yearsExperience })
                      : t("empty")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("rateLabel")}</dt>
                  <dd className="font-medium">
                    {rateLabel
                      ? t("rateFrom", { rate: rateLabel })
                      : t("rateOnRequest")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("groupLabel")}</dt>
                  <dd className="font-medium">
                    {t("groupUpTo", { count: maxGroupSize })}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("nextAvailableLabel")}</dt>
                  <dd className="font-medium">
                    {availableToday
                      ? t("today")
                      : nextAvailableDate
                        ? formatScheduleDate(locale, nextAvailableDate)
                        : t("empty")}
                  </dd>
                </div>
              </dl>

              {guide.website ? (
                <a
                  href={guide.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-sm underline"
                >
                  <Globe className="h-4 w-4" />
                  {guide.website.replace(/^https?:\/\//i, "")}
                </a>
              ) : null}
            </CardContent>
          </Card>

          {/*
           * Where a tour listing used to be: the guide's open time. You are not
           * picking a product, you are asking for a block of their day.
           */}
          <Card id="request">
            <CardHeader>
              <CardTitle>{t("booking.title", { name: firstName })}</CardTitle>
            </CardHeader>
            <CardContent>
              <GuideBookingPanel
                locale={locale}
                guideFirstName={firstName}
                slots={openSlots.map((slot) => ({
                  id: slot.id,
                  date: slot.date,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  note: slot.note,
                  durationHours: slot.durationHours,
                }))}
                hourlyRate={hourlyRate}
                maxGroupSize={maxGroupSize}
                signedIn={Boolean(user)}
                isOwnProfile={isOwnProfile}
                signInHref={signInHref}
              />
            </CardContent>
          </Card>

          {reviews.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("reviewsTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={usablePhoto(review.avatar) ?? undefined} alt={review.author} />
                      <AvatarFallback>{getInitials(review.author)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{review.author}</span>
                        <Stars
                          rating={review.rating}
                          label={starsLabel(review.rating)}
                        />
                        {review.date ? (
                          <span className="text-xs text-muted-foreground">
                            {formatScheduleDate(locale, review.date)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t("howTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{t("howBody1")}</p>
              <p>{t("howBody2")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("connectTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    {t("signInPrompt")}
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={signInHref}>{t("signInAction")}</Link>
                  </Button>
                </>
              ) : canSeeContact ? (
                <>
                  {confirmedBooking ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <div className="font-medium">
                        {formatScheduleDate(locale, confirmedBooking.date)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {confirmedBooking.startTime && confirmedBooking.endTime
                          ? `${confirmedBooking.startTime} – ${confirmedBooking.endTime}`
                          : confirmedBooking.startTime ?? ""}
                        {` · ${t("guests", {
                          count: confirmedBooking.partySize,
                        })}`}
                      </div>
                      {confirmedBooking.meetingPoint ? (
                        <div className="mt-2 flex items-start gap-1.5 text-xs">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          <span>{confirmedBooking.meetingPoint}</span>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {t("agreeMeetingPoint")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t("sharePreferences")}
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">{t("emailLabel")}</span>{" "}
                      {guide.email ? (
                        <a className="underline" href={`mailto:${guide.email}`}>
                          {guide.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("notProvided")}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{t("phoneLabel")}</span>{" "}
                      {guide.phone ? (
                        <a className="underline" href={`tel:${guide.phone}`}>
                          {guide.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("notProvided")}
                        </span>
                      )}
                    </div>
                  </div>

                  {confirmedBooking ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={`/api/reservations/${confirmedBooking.id}/calendar?locale=${locale}`}
                      >
                        <CalendarPlus className="size-4" />
                        {t("addToCalendar")}
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/10 p-3 text-sm text-muted-foreground">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    <span>{t("contactLocked", { name: firstName })}</span>
                  </div>
                  {openSlots.length > 0 ? (
                    <Button className="w-full" asChild>
                      <a href="#request">{t("requestBooking")}</a>
                    </Button>
                  ) : null}
                </>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link href="/browse">{t("browseMore")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
