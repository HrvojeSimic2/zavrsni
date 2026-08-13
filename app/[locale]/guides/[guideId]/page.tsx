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
import { formatMoney } from "@/lib/format/money";
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

const interestLabels: Record<string, string> = {
  food: "Food",
  nature: "Nature",
  culture: "Culture",
  adventure: "Adventure",
  history: "History",
};

function formatPlace(location: string | null, country: string | null) {
  const parts = [location, country].map((part) => String(part ?? "").trim());
  return parts.filter(Boolean).join(", ");
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
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

  const {
    guide: guideRow,
    interests,
    rating,
    reviewCount,
    availableToday,
    nextAvailableDate,
    tours,
    reviews,
  } = await fetchGuideProfile(guideId);

  if (!guideRow) notFound();

  const languages = guideRow.languages ?? [];
  const languagesLabel = languages.length > 0 ? languages.join(" · ") : "—";
  const yearsExperience = guideRow.years_experience ?? null;

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

  const signInQuery = new URLSearchParams();
  signInQuery.set("next", `/${locale}/guides/${guideId}`);
  signInQuery.set("message", "Sign in to connect with this guide.");

  return (
    <PageShell variant="contained" contentClassName="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <Avatar className="h-20 w-20">
            <AvatarImage src={guide.avatar ?? undefined} alt={guide.name} />
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
                {guide.location ?? "—"}
              </span>
              {reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Stars rating={rating} />
                  {rating.toFixed(1)} ({reviewCount})
                </span>
              ) : null}
              {guide.verified ? (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Verified
                </Badge>
              ) : null}
              {availableToday ? (
                <Badge className="bg-secondary/15 text-secondary border-secondary/30">
                  Available today
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwnProfile ? (
            <Button asChild variant="outline">
              <Link href="/guide/profile">Edit profile</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/browse">Find another guide</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {guide.bio ? (
            <Card>
              <CardHeader>
                <CardTitle>About {guide.name.split(/\s+/)[0]}</CardTitle>
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
              <CardTitle>What this guide is great at</CardTitle>
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
                      {interestLabels[interest] ?? interest}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="rounded-full">
                    Fully customizable
                  </Badge>
                )}
              </div>

              <Separator />

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Languages</dt>
                  <dd className="font-medium">{languagesLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Experience</dt>
                  <dd className="font-medium">
                    {yearsExperience !== null
                      ? `${yearsExperience} year${yearsExperience === 1 ? "" : "s"} guiding`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tours offered</dt>
                  <dd className="font-medium">{tours.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Next available</dt>
                  <dd className="font-medium">
                    {availableToday
                      ? "Today"
                      : nextAvailableDate
                        ? formatScheduleDate(locale, nextAvailableDate)
                        : "—"}
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

          <Card>
            <CardHeader>
              <CardTitle>Tours by {guide.name.split(/\s+/)[0]}</CardTitle>
            </CardHeader>
            <CardContent>
              {tours.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This guide has not published any tours yet.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  {tours.map((tour) => (
                    <Link
                      key={tour.id}
                      href={`/tour/${tour.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/20 [&:not(:last-child)]:border-b"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{tour.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {[
                            formatPlace(tour.location, tour.country),
                            tour.duration,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {tour.price !== null ? (
                          <div className="font-medium">{formatMoney(locale, tour.price)}</div>
                        ) : null}
                        {tour.reviewCount > 0 ? (
                          <div className="text-xs text-muted-foreground">
                            {tour.rating.toFixed(1)} ({tour.reviewCount})
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {reviews.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>What travellers say</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={review.avatar ?? undefined} alt={review.author} />
                      <AvatarFallback>{getInitials(review.author)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{review.author}</span>
                        <Stars rating={review.rating} />
                        {review.date ? (
                          <span className="text-xs text-muted-foreground">
                            {formatScheduleDate(locale, review.date)}
                          </span>
                        ) : null}
                      </div>
                      {review.tourTitle ? (
                        <div className="text-xs text-muted-foreground">
                          {review.tourTitle}
                        </div>
                      ) : null}
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
              <CardTitle>How LocalPath works here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                LocalPath’s job is to match you with the best guide for your
                location, interests, and availability.
              </p>
              <p>
                After you connect, you and the guide decide the exact tour plan
                together (route, timing, pace, stops, food, accessibility, and
                any special requests).
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Sign in to book a tour and connect with this guide.
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/auth/sign-in?${signInQuery.toString()}`}>
                      Sign in to connect
                    </Link>
                  </Button>
                </>
              ) : canSeeContact ? (
                <>
                  {confirmedBooking ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <div className="font-medium">
                        {confirmedBooking.tourTitle}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatScheduleDate(locale, confirmedBooking.date)}
                        {confirmedBooking.startTime
                          ? ` · ${confirmedBooking.startTime.slice(0, 5)}`
                          : ""}
                        {` · ${confirmedBooking.partySize} ${
                          confirmedBooking.partySize === 1 ? "guest" : "guests"
                        }`}
                      </div>
                      {confirmedBooking.meetingPoint ? (
                        <div className="mt-2 flex items-start gap-1.5 text-xs">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          <span>{confirmedBooking.meetingPoint}</span>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Agree on a meeting point with your guide.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Share your preferences and set a time to plan together.
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {guide.email ? (
                        <a className="underline" href={`mailto:${guide.email}`}>
                          {guide.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {guide.phone ? (
                        <a className="underline" href={`tel:${guide.phone}`}>
                          {guide.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  </div>

                  {confirmedBooking ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={`/api/reservations/${confirmedBooking.id}/calendar`}
                      >
                        <CalendarPlus className="size-4" />
                        Add to calendar
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/10 p-3 text-sm text-muted-foreground">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Contact details and the meeting point unlock once{" "}
                      {guide.name.split(/\s+/)[0]} confirms your booking.
                    </span>
                  </div>
                  {tours.length > 0 ? (
                    <Button className="w-full" asChild>
                      <Link href={`/tour/${tours[0].id}`}>Request a booking</Link>
                    </Button>
                  ) : null}
                </>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link href="/browse">Browse more guides</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
