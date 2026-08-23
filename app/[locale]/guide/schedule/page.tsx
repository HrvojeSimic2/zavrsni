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
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { window?: string }
    | Promise<{ window?: string } | undefined>;
};

const WINDOW_OPTIONS = [
  { days: 30, labelKey: "window30" },
  { days: 60, labelKey: "window60" },
  { days: 90, labelKey: "window90" },
] as const;

export default async function GuideSchedulePage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};
  const t = await getTranslations("GuideDashboard");
  const tPage = await getTranslations("GuideDashboard.schedule");

  const requestedWindow = Number(resolvedSearch.window);
  const windowDays = WINDOW_OPTIONS.some((option) => option.days === requestedWindow)
    ? requestedWindow
    : 30;

  const { supabase, guide, needsClaim } = await requireGuide(
    locale,
    "/guide/schedule"
  );

  const { upcomingSlots, upcomingReservations, metrics } =
    await fetchGuideDashboardData(supabase, guide.id, {
      windowDays,
      slotLimit: 400,
      reservationLimit: 400,
    });

  const today = new Date().toISOString().slice(0, 10);
  const schedule = buildGuideSchedule(upcomingSlots, upcomingReservations);
  const daysWithBookings = schedule.filter((day) => day.bookedGuests > 0).length;

  return (
    <PageShell variant="contained" contentClassName="max-w-6xl space-y-8">
      <GuidePageHeader
        title={tPage("title")}
        description={tPage("description")}
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? t("verified") : t("notVerified")}
          </Badge>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/guide/events">{tPage("manageAvailability")}</Link>
          </Button>
        }
      />

      <GuideDashboardNav active="schedule" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          descriptionKey="descriptionAvailability"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <GuideMetricCard
          label={tPage("metricDays")}
          value={schedule.length}
          hint={tPage("metricDaysHint", { n: daysWithBookings })}
          icon={CalendarDays}
        />
        <GuideMetricCard
          label={tPage("metricGuests")}
          value={metrics.upcomingGuests}
          hint={tPage("metricGuestsHint", {
            n: metrics.upcomingReservationCount,
          })}
          icon={Users}
        />
        <GuideMetricCard
          label={tPage("metricOpen")}
          value={metrics.openSlotCount}
          hint={
            metrics.fillRate === null
              ? tPage("metricOpenNoSlots")
              : tPage("metricOpenHint", {
                  percent: Math.round(metrics.fillRate * 100),
                })
          }
          icon={ClipboardList}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{tPage("windowTitle", { n: windowDays })}</CardTitle>
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
                    {tPage(option.labelKey)}
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
