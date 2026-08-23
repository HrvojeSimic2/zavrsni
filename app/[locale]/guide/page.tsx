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
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
};

const SCHEDULE_PREVIEW_DAYS = 5;

export default async function GuideDashboardPage({ params }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const t = await getTranslations("GuideDashboard");
  const tPage = await getTranslations("GuideDashboard.overview");

  const { supabase, guide, needsClaim } = await requireGuide(locale, "/guide");

  // Past bookings settle themselves, so the metrics below count what really happened.
  await settleCompletedReservationsThrottled();

  const { metrics, upcomingSlots, upcomingReservations } =
    await fetchGuideDashboardData(supabase, guide.id);

  const today = new Date().toISOString().slice(0, 10);
  const schedule = buildGuideSchedule(upcomingSlots, upcomingReservations);
  const schedulePreview = schedule.slice(0, SCHEDULE_PREVIEW_DAYS);

  const pendingReservations = upcomingReservations.filter(
    (reservation) => reservation.status === "pending"
  );

  const fillRateLabel =
    metrics.fillRate === null
      ? t("empty")
      : `${Math.round(metrics.fillRate * 100)}%`;

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
          <>
            {/* `disabled` on an asChild button reaches an anchor, which ignores
                it, so an unclaimed profile gets a real disabled button. */}
            {needsClaim ? (
              <Button disabled>{tPage("openSlots")}</Button>
            ) : (
              <Button asChild>
                <Link href="/guide/events">{tPage("openSlots")}</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/guide/profile">{tPage("editProfile")}</Link>
            </Button>
          </>
        }
      />

      <GuideDashboardNav active="overview" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          descriptionKey="descriptionFull"
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/profile">{tPage("goToProfile")}</Link>
            </Button>
          }
        />
      ) : null}

      {pendingReservations.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">
                {tPage("pendingBanner", { n: pendingReservations.length })}
              </div>
              <div className="text-sm text-muted-foreground">
                {tPage("pendingBannerHint")}
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/guide/reservations">{tPage("reviewRequests")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GuideMetricCard
          label={tPage("metricGuests")}
          value={metrics.upcomingGuests}
          hint={tPage("metricGuestsHint", {
            n: metrics.upcomingReservationCount,
          })}
          icon={Users}
        />
        <GuideMetricCard
          label={tPage("metricRevenue")}
          value={formatMoney(locale, metrics.upcomingRevenue, metrics.currency)}
          hint={tPage("metricRevenueHint")}
          icon={TrendingUp}
        />
        <GuideMetricCard
          label={tPage("metricCapacity")}
          value={fillRateLabel}
          hint={tPage("metricCapacityHint", {
            booked: metrics.bookedSlotCount,
            left: metrics.openSlotCount,
          })}
          icon={ClipboardList}
        />
        <GuideMetricCard
          label={tPage("metricDates")}
          value={metrics.openSlotCount}
          hint={tPage("metricDatesHint", { n: metrics.openHours })}
          icon={CalendarDays}
        />
        <GuideMetricCard
          label={tPage("metricRating")}
          value={metrics.rating > 0 ? metrics.rating.toFixed(1) : t("empty")}
          hint={tPage("metricRatingHint", { n: metrics.reviewCount })}
          icon={Star}
        />
        <GuideMetricCard
          label={tPage("metricLast30")}
          value={formatMoney(locale, metrics.revenueLast30, metrics.currency)}
          hint={tPage("metricLast30Hint", { n: metrics.reservationsLast30 })}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{tPage("scheduleTitle")}</CardTitle>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/guide/schedule">{tPage("fullSchedule")}</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <GuideScheduleList
            locale={locale}
            today={today}
            days={schedulePreview}
            emptyLabel={
              upcomingSlots.length === 0
                ? tPage("scheduleEmptyNoSlots")
                : tPage("scheduleEmpty")
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{tPage("eventsTitle")}</CardTitle>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/guide/events">{tPage("viewAll")}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcomingSlots.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                {tPage("eventsEmpty")}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                {upcomingSlots.slice(0, 6).map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/20 [&:not(:last-child)]:border-b"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {`${slot.startTime} – ${slot.endTime}`}
                        {slot.note ? ` · ${slot.note}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatScheduleDate(locale, slot.date)}
                      </div>
                    </div>
                    <Badge variant={slot.booked ? "default" : "secondary"}>
                      {slot.booked ? tPage("slotTaken") : tPage("slotOpen")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>{tPage("reservationsTitle")}</CardTitle>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/guide/reservations">{tPage("viewAll")}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcomingReservations.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                {tPage("reservationsEmpty")}
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
                          {reservation.customerName ?? tPage("guest")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {`${formatScheduleDate(locale, reservation.date)}${
                            reservation.startTime ? ` · ${reservation.startTime}` : ""
                          } | ${tPage("party", { n: reservation.partySize })}`}
                        </div>
                      </div>
                      <Badge variant={badge.variant}>
                        {t(`status.${badge.key}`)}
                      </Badge>
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
