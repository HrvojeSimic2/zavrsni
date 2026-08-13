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
  emptyLabel?: string;
};

export function GuideScheduleList({
  locale,
  today,
  days,
  emptyLabel = "Nothing scheduled yet. Add availability to a tour to open up dates.",
}: Props) {
  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
        {emptyLabel}
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
                      {relative}
                    </Badge>
                  ) : null}
                  {day.hasPending ? (
                    <Badge variant="secondary">Needs response</Badge>
                  ) : null}
                </div>
                <div className="text-xs capitalize text-muted-foreground">
                  {formatScheduleWeekday(locale, day.date)}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" />
                  {day.bookedGuests} booked
                </span>
                <span>{day.availableSpots} spots left</span>
              </div>
            </div>

            <div>
              {day.entries.map((entry) => (
                <div
                  key={`${day.date}:${entry.tourId ?? entry.tourTitle}`}
                  className="px-4 py-3 text-sm [&:not(:last-child)]:border-b"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 font-medium truncate">
                      {entry.tourTitle}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.bookedGuests > 0 ? (
                        <Badge variant="outline">
                          {entry.bookedGuests} guests
                        </Badge>
                      ) : null}
                      {entry.availableSpots !== null ? (
                        <Badge variant="secondary">
                          {entry.availableSpots} spots
                        </Badge>
                      ) : null}
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
                              {reservation.customerName ?? "Guest"} · party of{" "}
                              {reservation.partySize}
                            </span>
                            <Badge variant={badge.variant}>{badge.text}</Badge>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">
                      No reservations yet for this date.
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
