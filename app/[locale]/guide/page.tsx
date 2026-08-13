import { PageShell } from "@/components/layout/page-shell";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { GuideDashboardNav } from "@/components/guide/guide-dashboard-nav";
import { GuidePageHeader } from "@/components/guide/guide-page-header";
import { ClaimGuideProfileCard } from "@/components/guide/claim-guide-profile-card";
import { NewTourDialog } from "@/components/guide/new-tour-dialog";
import { GuideMetricCard } from "@/components/guide/guide-metric-card";
import { GuideScheduleList } from "@/components/guide/guide-schedule-list";
import { requireGuide } from "@/lib/guide/require-guide";
import { settleCompletedReservationsThrottled } from "@/lib/reservations/settle-completed";
import { fetchGuideDashboardData } from "@/lib/guide/guide-dashboard-data";
import { buildGuideSchedule } from "@/lib/guide/guide-schedule";
import {
  formatMoney,
  formatScheduleDate,
  reservationBadge,
} from "@/lib/guide/reservation-status";
import {
  CalendarDays,
  ClipboardList,
  Map,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
};

const SCHEDULE_PREVIEW_DAYS = 5;

export default async function GuideDashboardPage({ params }: PageProps) {
  const { locale } = await Promise.resolve(params);

  const { supabase, guide, needsClaim } = await requireGuide(locale, "/guide");

  // Past tours settle themselves, so the metrics below count what really happened.
  await settleCompletedReservationsThrottled();

  const { metrics, upcomingEvents, upcomingReservations, tours } =
    await fetchGuideDashboardData(supabase, guide.id);

  const today = new Date().toISOString().slice(0, 10);
  const schedule = buildGuideSchedule(upcomingEvents, upcomingReservations);
  const schedulePreview = schedule.slice(0, SCHEDULE_PREVIEW_DAYS);

  const pendingReservations = upcomingReservations.filter(
    (reservation) => reservation.status === "pending"
  );

  const fillRateLabel =
    metrics.fillRate === null ? "—" : `${Math.round(metrics.fillRate * 100)}%`;

  return (
    <PageShell variant="contained" contentClassName="max-w-6xl space-y-8">
      <GuidePageHeader
        title="Overview"
        description="Your numbers for the next 30 days, plus what is coming up."
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? "Verified" : "Not verified"}
          </Badge>
        }
        actions={
          <>
            <NewTourDialog locale={locale} disabled={needsClaim} />
            <Button asChild variant="outline">
              <Link href="/guide/profile">Edit profile</Link>
            </Button>
          </>
        }
      />

      <GuideDashboardNav active="overview" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          description="We found a guide profile that matches your email. Claim it to create tours, manage availability, and handle reservations."
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/profile">Go to profile</Link>
            </Button>
          }
        />
      ) : null}

      {pendingReservations.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">
                {pendingReservations.length} reservation
                {pendingReservations.length === 1 ? "" : "s"} waiting on you
              </div>
              <div className="text-sm text-muted-foreground">
                Confirm or decline them so guests can plan their trip.
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/guide/reservations">Review requests</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GuideMetricCard
          label="Upcoming guests"
          value={metrics.upcomingGuests}
          hint={`Across ${metrics.upcomingReservationCount} reservation${
            metrics.upcomingReservationCount === 1 ? "" : "s"
          }`}
          icon={Users}
        />
        <GuideMetricCard
          label="Expected revenue"
          value={formatMoney(locale, metrics.upcomingRevenue, metrics.currency)}
          hint="Confirmed bookings, next 30 days"
          icon={TrendingUp}
        />
        <GuideMetricCard
          label="Capacity sold"
          value={fillRateLabel}
          hint={`${metrics.bookedGuestsNext30} booked · ${metrics.upcomingSpots} spots left`}
          icon={ClipboardList}
        />
        <GuideMetricCard
          label="Scheduled dates"
          value={metrics.upcomingEventCount}
          hint={`${metrics.tourCount} tour${metrics.tourCount === 1 ? "" : "s"} published`}
          icon={CalendarDays}
        />
        <GuideMetricCard
          label="Rating"
          value={metrics.rating > 0 ? metrics.rating.toFixed(1) : "—"}
          hint={`${metrics.reviewCount} review${metrics.reviewCount === 1 ? "" : "s"}`}
          icon={Star}
        />
        <GuideMetricCard
          label="Last 30 days"
          value={formatMoney(locale, metrics.revenueLast30, metrics.currency)}
          hint={`${metrics.reservationsLast30} reservation${
            metrics.reservationsLast30 === 1 ? "" : "s"
          } completed`}
          icon={Map}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Schedule</CardTitle>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/guide/schedule">Full schedule</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <GuideScheduleList
            locale={locale}
            today={today}
            days={schedulePreview}
            emptyLabel={
              tours.length === 0
                ? "Create your first tour, then add dates to start filling your schedule."
                : "No dates scheduled yet. Add availability to a tour to open up bookings."
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Upcoming events</CardTitle>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/guide/events">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                No upcoming availability yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                {upcomingEvents.slice(0, 6).map((event) => (
                  <div
                    key={`${event.tourId}:${event.date}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/20 [&:not(:last-child)]:border-b"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{event.tourTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatScheduleDate(locale, event.date)}
                      </div>
                    </div>
                    <Badge variant="secondary">{event.availableSpots} spots</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Upcoming reservations</CardTitle>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/guide/reservations">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcomingReservations.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                No reservations yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                {upcomingReservations.slice(0, 6).map((reservation) => {
                  const badge = reservationBadge(reservation.status);
                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/20 [&:not(:last-child)]:border-b"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {reservation.tourTitle}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatScheduleDate(locale, reservation.date)} | Party{" "}
                          {reservation.partySize}
                        </div>
                      </div>
                      <Badge variant={badge.variant}>{badge.text}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
