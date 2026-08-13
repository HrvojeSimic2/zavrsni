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
import { Trash2 } from "lucide-react";
import { removeAvailabilityAction } from "./actions";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { status?: string; error?: string }
    | Promise<{ status?: string; error?: string } | undefined>;
};

type AvailabilityRow = {
  tour_id: string;
  date: string;
  available_spots: number | null;
  tour: { id: string; title: string }[] | { id: string; title: string } | null;
};

export default async function GuideEventsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};

  const { supabase, guide, needsClaim } = await requireGuide(
    locale,
    "/guide/events"
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: tours, error: toursError } = await supabase
    .from("tours")
    .select("id, title, group_size")
    .eq("guide_id", guide.id)
    .order("title", { ascending: true });

  if (toursError) {
    console.warn("[guide.events] failed to load tours", toursError);
  }

  const tourRows = (tours ?? []) as Array<{
    id: string;
    title: string;
    group_size: string | null;
  }>;
  const tourIds = tourRows.map((tour) => tour.id);

  const { data: availability, error: availabilityError } = tourIds.length
    ? await supabase
        .from("tour_availability")
        .select("tour_id, date, available_spots, tour:tours ( id, title )")
        .in("tour_id", tourIds)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(200)
    : { data: [], error: null };

  if (availabilityError) {
    console.warn("[guide.events] failed to load availability", availabilityError);
  }

  const rows = (availability as AvailabilityRow[] | null) ?? [];

  // Booked guests per date, so a full day reads as full rather than as "0 spots".
  const { data: bookedRows } = tourIds.length
    ? await supabase
        .from("reservations")
        .select("tour_id, date, party_size, status")
        .in("tour_id", tourIds)
        .gte("date", today)
        .in("status", ["pending", "confirmed"])
    : { data: [] };

  const bookedByKey = new Map<string, number>();
  for (const row of (bookedRows ?? []) as Array<Record<string, unknown>>) {
    const key = `${String(row.tour_id)}:${String(row.date)}`;
    bookedByKey.set(key, (bookedByKey.get(key) ?? 0) + Number(row.party_size ?? 0));
  }

  return (
    <PageShell variant="contained" contentClassName="max-w-6xl space-y-8">
      <GuidePageHeader
        title="Dates"
        description="Open the days you can run a tour. Travellers can only book these."
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? "Verified" : "Not verified"}
          </Badge>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/guide/schedule">View schedule</Link>
          </Button>
        }
      />

      <GuideDashboardNav active="events" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          description="Claim your profile to manage availability and reservations."
        />
      ) : null}

      {resolvedSearch.status ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          {resolvedSearch.status}
        </div>
      ) : null}

      {resolvedSearch.error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {resolvedSearch.error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Open new dates</CardTitle>
        </CardHeader>
        <CardContent>
          <AddAvailabilityForm
            locale={locale}
            disabled={needsClaim}
            tours={tourRows.map((tour) => ({
              id: tour.id,
              title: tour.title,
              groupSize: tour.group_size,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Upcoming availability</CardTitle>
          <CardAction>
            <Badge variant="secondary">{rows.length} total</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              No dates open yet. Use the form above so travellers can book.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              {rows.map((row) => {
                const tour = Array.isArray(row.tour) ? row.tour[0] : row.tour;
                const booked = bookedByKey.get(`${row.tour_id}:${row.date}`) ?? 0;
                const spots = row.available_spots ?? 0;

                return (
                  <div
                    key={`${row.tour_id}:${row.date}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/20 [&:not(:last-child)]:border-b"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {tour?.title ?? "Tour"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatScheduleDate(locale, row.date)}
                        {booked > 0 ? ` | ${booked} booked` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={spots === 0 ? "outline" : "secondary"}>
                        {spots === 0 ? "Full" : `${spots} spots`}
                      </Badge>
                      <form action={removeAvailabilityAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="tourId" value={row.tour_id} />
                        <input type="hidden" name="date" value={row.date} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={needsClaim}
                          aria-label={`Remove ${row.date}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
