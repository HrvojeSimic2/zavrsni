import { PageShell } from "@/components/layout/page-shell";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { GuideDashboardNav } from "@/components/guide/guide-dashboard-nav";
import { GuidePageHeader } from "@/components/guide/guide-page-header";
import { ClaimGuideProfileCard } from "@/components/guide/claim-guide-profile-card";
import { GuideMetricCard } from "@/components/guide/guide-metric-card";
import { GuideScheduleList } from "@/components/guide/guide-schedule-list";
import { requireGuide } from "@/lib/guide/require-guide";
import { fetchGuideDashboardData } from "@/lib/guide/guide-dashboard-data";
import { buildGuideSchedule } from "@/lib/guide/guide-schedule";
import { CalendarDays, ClipboardList, Users } from "lucide-react";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { window?: string }
    | Promise<{ window?: string } | undefined>;
};

const WINDOW_OPTIONS = [
  { days: 30, label: "30 days" },
  { days: 60, label: "60 days" },
  { days: 90, label: "90 days" },
];

export default async function GuideSchedulePage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};

  const requestedWindow = Number(resolvedSearch.window);
  const windowDays = WINDOW_OPTIONS.some((option) => option.days === requestedWindow)
    ? requestedWindow
    : 30;

  const { supabase, guide, needsClaim } = await requireGuide(
    locale,
    "/guide/schedule"
  );

  const { upcomingEvents, upcomingReservations, metrics } =
    await fetchGuideDashboardData(supabase, guide.id, {
      windowDays,
      eventLimit: 400,
      reservationLimit: 400,
    });

  const today = new Date().toISOString().slice(0, 10);
  const schedule = buildGuideSchedule(upcomingEvents, upcomingReservations);
  const daysWithBookings = schedule.filter((day) => day.bookedGuests > 0).length;

  return (
    <PageShell variant="contained" contentClassName="max-w-6xl space-y-8">
      <GuidePageHeader
        title="Schedule"
        description="Every scheduled date with the guests booked on it."
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? "Verified" : "Not verified"}
          </Badge>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/guide/events">Manage availability</Link>
          </Button>
        }
      />

      <GuideDashboardNav active="schedule" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          description="Claim your profile to manage availability and reservations."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <GuideMetricCard
          label="Scheduled days"
          value={schedule.length}
          hint={`${daysWithBookings} with bookings`}
          icon={CalendarDays}
        />
        <GuideMetricCard
          label="Guests booked"
          value={metrics.upcomingGuests}
          hint={`${metrics.upcomingReservationCount} reservations`}
          icon={Users}
        />
        <GuideMetricCard
          label="Spots left"
          value={metrics.upcomingSpots}
          hint={
            metrics.fillRate === null
              ? "No capacity scheduled"
              : `${Math.round(metrics.fillRate * 100)}% of capacity sold`
          }
          icon={ClipboardList}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Next {windowDays} days</CardTitle>
          <CardAction>
            <div className="flex flex-wrap gap-1">
              {WINDOW_OPTIONS.map((option) => (
                <Button
                  key={option.days}
                  asChild
                  size="sm"
                  variant={option.days === windowDays ? "default" : "outline"}
                >
                  <Link href={`/guide/schedule?window=${option.days}`}>
                    {option.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <GuideScheduleList locale={locale} today={today} days={schedule} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
