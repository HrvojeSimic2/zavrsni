import { PageShell } from "@/components/layout/page-shell";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { GuideDashboardNav } from "@/components/guide/guide-dashboard-nav";
import { GuidePageHeader } from "@/components/guide/guide-page-header";
import { ClaimGuideProfileCard } from "@/components/guide/claim-guide-profile-card";
import { requireGuide } from "@/lib/guide/require-guide";
import {
  formatScheduleDate,
  reservationBadge,
} from "@/lib/guide/reservation-status";
import type { ReservationStatus } from "@/lib/guide/guide-dashboard-data";
import { CalendarPlus } from "lucide-react";
import { updateReservationStatusAction } from "./actions";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
};

type ReservationRow = {
  id: string;
  date: string;
  party_size: number | null;
  status: ReservationStatus | null;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number | null;
  currency: string | null;
  created_at: string;
  tour: { id: string; title: string }[] | { id: string; title: string } | null;
};

export default async function GuideReservationsPage({ params }: PageProps) {
  const { locale } = await Promise.resolve(params);

  const { supabase, guide, needsClaim } = await requireGuide(
    locale,
    "/guide/reservations"
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select(
      "id, date, party_size, status, customer_name, customer_email, total_amount, currency, created_at, tour:tours ( id, title )"
    )
    .eq("guide_id", guide.id)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(200);

  if (reservationsError) {
    if ((reservationsError as { code?: string } | null)?.code === "PGRST205") {
      console.warn(
        "[guide.reservations] missing public.reservations table. Did you run the Supabase migrations? Try `npm run supabase:reset` (local) or `npm run supabase:push` (hosted).",
        reservationsError
      );
    } else {
      console.warn("[guide.reservations] failed to load reservations", reservationsError);
    }
  }

  const rows = (reservations as ReservationRow[] | null) ?? [];
  const pending = rows.filter((row) => (row.status ?? "pending") === "pending");
  const answered = rows.filter((row) => (row.status ?? "pending") !== "pending");

  const renderRow = (row: ReservationRow, withActions: boolean) => {
    const tour = Array.isArray(row.tour) ? row.tour[0] : row.tour;
    const badge = reservationBadge(row.status ?? "pending");

    return (
      <div
        key={row.id}
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/20 [&:not(:last-child)]:border-b"
      >
        <div className="min-w-0">
          <div className="font-medium truncate">{tour?.title ?? "Tour"}</div>
          <div className="text-xs text-muted-foreground">
            {row.customer_name ? `${row.customer_name} | ` : ""}
            {formatScheduleDate(locale, row.date)} | Party {row.party_size ?? 1}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.text}</Badge>
          {(row.status ?? "pending") === "confirmed" ? (
            <Button asChild size="sm" variant="ghost">
              <a href={`/api/reservations/${row.id}/calendar`}>
                <CalendarPlus className="size-4" />
                Calendar
              </a>
            </Button>
          ) : null}
          {withActions ? (
            <div className="flex gap-2">
              <form action={updateReservationStatusAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="reservationId" value={row.id} />
                <input type="hidden" name="status" value="confirmed" />
                <Button type="submit" size="sm" disabled={needsClaim}>
                  Confirm
                </Button>
              </form>
              <form action={updateReservationStatusAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="reservationId" value={row.id} />
                <input type="hidden" name="status" value="cancelled" />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={needsClaim}
                >
                  Decline
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <PageShell variant="contained" contentClassName="max-w-6xl space-y-8">
      <GuidePageHeader
        title="Reservations"
        description="Bookings made for your tours."
        badge={
          <Badge variant={guide.verified ? "default" : "secondary"}>
            {guide.verified ? "Verified" : "Not verified"}
          </Badge>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/guide/tours">View tours</Link>
          </Button>
        }
      />

      <GuideDashboardNav active="reservations" />

      {needsClaim ? (
        <ClaimGuideProfileCard
          locale={locale}
          guideId={guide.id}
          description="Claim your profile to view and manage reservations."
        />
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Requests waiting on you</CardTitle>
          <CardAction>
            <Badge variant={pending.length > 0 ? "default" : "secondary"}>
              {pending.length} pending
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              No requests waiting for an answer.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              {pending.map((row) => renderRow(row, true))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Upcoming reservations</CardTitle>
          <CardAction>
            <Badge variant="secondary">{answered.length} total</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {answered.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              No confirmed reservations yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              {answered.map((row) => renderRow(row, false))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
