import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { CalendarPlus, MapPin } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import {
  fetchTravellerBookings,
  type TravellerBooking,
} from "@/lib/bookings/get-traveller-bookings";
import { formatMoney, formatScheduleDate } from "@/lib/guide/reservation-status";
import { settleCompletedReservationsThrottled } from "@/lib/reservations/settle-completed";
import { cancelBookingAction } from "./actions";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?:
    | { status?: string; error?: string }
    | Promise<{ status?: string; error?: string } | undefined>;
};

export const dynamic = "force-dynamic";

export default async function BookingsPage({ params, searchParams }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearch = (await Promise.resolve(searchParams)) ?? {};
  const t = await getTranslations("Bookings");

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const query = new URLSearchParams();
    query.set("next", `/${locale}/bookings`);
    query.set("message", "Sign in to see your trips.");
    redirect(`/${locale}/auth/sign-in?${query.toString()}`);
  }

  // Promote finished tours before listing, so nothing sits as "confirmed" forever.
  await settleCompletedReservationsThrottled();

  const { upcoming, past } = await fetchTravellerBookings(supabase, user);
  const today = new Date().toISOString().slice(0, 10);

  const statusLabel = (status: TravellerBooking["status"]) => {
    switch (status) {
      case "confirmed":
        return { text: t("statusConfirmed"), variant: "default" as const };
      case "cancelled":
        return { text: t("statusCancelled"), variant: "destructive" as const };
      case "completed":
        return { text: t("statusCompleted"), variant: "outline" as const };
      default:
        return { text: t("statusPending"), variant: "secondary" as const };
    }
  };

  const flash = (() => {
    const key = resolvedSearch.status;
    if (key === "cancelled") return { text: t("flashCancelled"), tone: "ok" };
    if (key === "alreadyCancelled")
      return { text: t("flashAlreadyCancelled"), tone: "ok" };

    const errorKey = resolvedSearch.error;
    const errors: Record<string, string> = {
      tooLate: t("errTooLate"),
      notFound: t("errNotFound"),
      notYours: t("errNotYours"),
      alreadyDone: t("errAlreadyDone"),
      failed: t("errFailed"),
      invalid: t("errInvalid"),
    };
    if (errorKey && errors[errorKey]) {
      return { text: errors[errorKey], tone: "error" };
    }
    return null;
  })();

  const renderBooking = (booking: TravellerBooking) => {
    const badge = statusLabel(booking.status);
    const isConfirmed = booking.status === "confirmed";
    // Matches the action's rule: the day of the tour is already too late.
    const canCancel =
      booking.date > today &&
      (booking.status === "pending" || booking.status === "confirmed");

    return (
      <div
        key={booking.id}
        className="space-y-3 px-4 py-4 [&:not(:last-child)]:border-b"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium">{booking.tourTitle}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {formatScheduleDate(locale, booking.date)}
              {booking.startTime ? ` · ${booking.startTime.slice(0, 5)}` : ""}
              {` · ${t("guests", { count: booking.partySize })}`}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("withGuide", { guide: booking.guideName })}
              {booking.place ? ` · ${booking.place}` : ""}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge variant={badge.variant}>{badge.text}</Badge>
            {booking.totalAmount !== null ? (
              <span className="text-sm font-medium tabular-nums">
                {formatMoney(locale, booking.totalAmount, booking.currency)}
              </span>
            ) : null}
          </div>
        </div>

        {isConfirmed && booking.meetingPoint ? (
          <div className="flex items-start gap-1.5 rounded-lg bg-muted/30 px-3 py-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium">{t("meetingPoint")}:</span>{" "}
              {booking.meetingPoint}
            </span>
          </div>
        ) : null}

        {booking.status === "pending" ? (
          <p className="text-xs text-muted-foreground">{t("awaitingNote")}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {booking.tourId ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/tour/${booking.tourId}`}>{t("viewTour")}</Link>
            </Button>
          ) : null}

          {isConfirmed ? (
            <>
              <Button asChild size="sm" variant="outline">
                <a href={`/api/reservations/${booking.id}/calendar`}>
                  <CalendarPlus className="size-4" />
                  {t("addToCalendar")}
                </a>
              </Button>
              {booking.guideId ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/guides/${booking.guideId}`}>
                    {t("contactGuide")}
                  </Link>
                </Button>
              ) : null}
            </>
          ) : null}

          {canCancel ? (
            <form action={cancelBookingAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="reservationId" value={booking.id} />
              <Button type="submit" size="sm" variant="ghost">
                {t("cancel")}
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <PageShell variant="contained" contentClassName="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/browse">{t("browse")}</Link>
        </Button>
      </div>

      {flash ? (
        <div
          className={
            flash.tone === "error"
              ? "rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              : "rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
          }
        >
          {flash.text}
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("upcoming")}</CardTitle>
          <CardAction>
            <Badge variant="secondary">{upcoming.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {upcoming.length === 0 ? (
            <div className="mx-4 rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              {t("emptyUpcoming")}
            </div>
          ) : (
            <div>{upcoming.map(renderBooking)}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("past")}</CardTitle>
          <CardAction>
            <Badge variant="secondary">{past.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {past.length === 0 ? (
            <div className="mx-4 rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              {t("emptyPast")}
            </div>
          ) : (
            <div>{past.map(renderBooking)}</div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
