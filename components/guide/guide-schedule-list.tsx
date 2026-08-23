import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import type { GuideScheduleDay } from "@/lib/guide/guide-schedule";
import {
  formatScheduleDate,
  formatScheduleWeekday,
  relativeDayLabel,
  reservationBadge,
} from "@/lib/guide/reservation-status";
import { Users } from "lucide-react";

type Props = {
  locale: string;
  today: string;
  days: GuideScheduleDay[];
  /** Overrides the default empty-state copy. */
  emptyLabel?: string;
};

export async function GuideScheduleList({
  locale,
  today,
  days,
  emptyLabel,
}: Props) {
  const t = await getTranslations("GuideDashboard");
  const tList = await getTranslations("GuideDashboard.scheduleList");

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
        {emptyLabel ?? tList("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const relative = relativeDayLabel(day.date, today);

        return (
          <div key={day.date} className="overflow-hidden rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {formatScheduleDate(locale, day.date)}
                  </span>
                  {relative ? (
                    <Badge variant="outline" className="rounded-full">
                      {t(
                        `relativeDay.${relative.key}`,
                        relative.key === "inDays" ? { n: relative.days } : undefined
                      )}
                    </Badge>
                  ) : null}
                  {day.hasPending ? (
                    <Badge variant="secondary">{tList("needsResponse")}</Badge>
                  ) : null}
                </div>
                <div className="text-xs capitalize text-muted-foreground">
                  {formatScheduleWeekday(locale, day.date)}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" />
                  {tList("booked", { n: day.bookedGuests })}
                </span>
                <span>{tList("openSlots", { n: day.openSlots })}</span>
              </div>
            </div>

            <div>
              {day.entries.map((entry) => (
                <div
                  key={`${day.date}:${entry.slotId ?? entry.startTime ?? "—"}`}
                  className="px-4 py-3 text-sm [&:not(:last-child)]:border-b"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 truncate">
                      <span className="font-medium">
                        {entry.startTime && entry.endTime
                          ? `${entry.startTime} – ${entry.endTime}`
                          : tList("timeUnknown")}
                      </span>
                      {entry.note ? (
                        <span className="text-muted-foreground"> · {entry.note}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.bookedGuests > 0 ? (
                        <Badge variant="outline">
                          {tList("guests", { n: entry.bookedGuests })}
                        </Badge>
                      ) : null}
                      <Badge variant={entry.open ? "secondary" : "default"}>
                        {entry.open ? tList("open") : tList("taken")}
                      </Badge>
                    </div>
                  </div>

                  {entry.reservations.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {entry.reservations.map((reservation) => {
                        const badge = reservationBadge(reservation.status);
                        return (
                          <li
                            key={reservation.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/20 px-3 py-2 text-xs"
                          >
                            <span className="min-w-0 truncate">
                              {tList("partyOf", {
                                name: reservation.customerName ?? tList("guest"),
                                n: reservation.partySize,
                              })}
                            </span>
                            <Badge variant={badge.variant}>
                              {t(`status.${badge.key}`)}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {tList("noReservations")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
