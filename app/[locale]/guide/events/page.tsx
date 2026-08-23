import { PageShell } from "@/components/layout/page-shell";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { GuideDashboardNav } from "@/components/guide/guide-dashboard-nav";
import { GuidePageHeader } from "@/components/guide/guide-page-header";
import { ClaimGuideProfileCard } from "@/components/guide/claim-guide-profile-card";
import { AddAvailabilityForm } from "@/components/guide/add-availability-form";
import { requireGuide } from "@/lib/guide/require-guide";
import { formatScheduleDate } from "@/lib/guide/reservation-status";
import { addDays, fetchOwnSlots, toISODate } from "@/lib/services/availability-service";
import { Trash2 } from "lucide-react";
import { removeSlotAction } from "./actions";
import { getTranslations } from "next-intl/server";
import { resolveFlash } from "@/lib/i18n/flash";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { status?: string; error?: string; n?: string }
    | Promise<{ status?: string; error?: string; n?: string } | undefined>;
};

/** How far ahead the slot list looks. */
const WINDOW_DAYS = 120;

export default async function GuideEventsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};
  const t = await getTranslations("GuideDashboard");
  const tPage = await getTranslations("GuideDashboard.events");

  // Flash keys that interpolate a count travel with an `n` query param.
  const flashCount = Number(resolvedSearch.n);
  const flashValues = Number.isFinite(flashCount) ? { n: flashCount } : undefined;
  const statusMessage = resolveFlash(t, "status", resolvedSearch.status, flashValues);
  const errorMessage = resolveFlash(t, "errors", resolvedSearch.error, flashValues);

  const { supabase, guide, needsClaim } = await requireGuide(
    locale,
    "/guide/events"
  );

  const today = toISODate(new Date());
  const windowEnd = toISODate(addDays(new Date(), WINDOW_DAYS));

  const slots = await fetchOwnSlots(supabase, guide.id, today, windowEnd);
  const openCount = slots.filter((slot) => !slot.booked).length;

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
            <Link href="/guide/schedule">{tPage("viewSchedule")}</Link>
          </Button>
        }
      />

      <GuideDashboardNav active="events" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          descriptionKey="descriptionAvailability"
        />
      ) : null}

      {statusMessage ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{tPage("openNewTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddAvailabilityForm locale={locale} disabled={needsClaim} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{tPage("upcomingTitle")}</CardTitle>
          <CardAction>
            <Badge variant="secondary">
              {tPage("openOfTotal", { open: openCount, total: slots.length })}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              {tPage("empty")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/20 [&:not(:last-child)]:border-b"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {formatScheduleDate(locale, slot.date)} · {slot.startTime} –{" "}
                      {slot.endTime}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tPage("hours", { count: slot.durationHours })}
                      {slot.note ? ` · ${slot.note}` : ""}
                      {slot.customerName
                        ? ` · ${tPage("bookedBy", {
                            name: slot.customerName,
                            count: slot.partySize ?? 1,
                          })}`
                        : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {slot.booked ? (
                      <Badge
                        variant={slot.status === "pending" ? "secondary" : "default"}
                      >
                        {slot.status === "pending"
                          ? tPage("pending")
                          : tPage("booked")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{tPage("open")}</Badge>
                    )}

                    {/* A booked slot is somebody's plan; it is cancelled from
                        the reservations page, not deleted from under them. */}
                    {slot.booked ? (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href="/guide/reservations">
                          {tPage("manageBooking")}
                        </Link>
                      </Button>
                    ) : (
                      <form action={removeSlotAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="slotId" value={slot.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={needsClaim}
                          aria-label={tPage("removeAria", {
                            date: slot.date,
                            time: slot.startTime,
                          })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
