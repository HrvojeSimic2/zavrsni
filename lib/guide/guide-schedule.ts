import type { GuideEvent, GuideReservation } from "@/lib/guide/guide-dashboard-data";

export type GuideScheduleEntry = {
  tourId: string | null;
  tourTitle: string;
  availableSpots: number | null;
  reservations: GuideReservation[];
  bookedGuests: number;
};

export type GuideScheduleDay = {
  date: string;
  entries: GuideScheduleEntry[];
  bookedGuests: number;
  availableSpots: number;
  reservationCount: number;
  hasPending: boolean;
};

/**
 * Merges availability rows and reservations into one day-by-day schedule.
 *
 * A day appears if it has availability, reservations, or both; within a day the
 * two are joined per tour so a guide sees "who is booked" next to "what is
 * still open" instead of two disconnected lists.
 */
export function buildGuideSchedule(
  events: GuideEvent[],
  reservations: GuideReservation[]
): GuideScheduleDay[] {
  const byDate = new Map<string, Map<string, GuideScheduleEntry>>();

  const entryFor = (date: string, tourId: string | null, tourTitle: string) => {
    const entriesByTour = byDate.get(date) ?? new Map<string, GuideScheduleEntry>();
    byDate.set(date, entriesByTour);

    const key = tourId ?? `untitled:${tourTitle}`;
    const existing = entriesByTour.get(key);
    if (existing) return existing;

    const created: GuideScheduleEntry = {
      tourId,
      tourTitle,
      availableSpots: null,
      reservations: [],
      bookedGuests: 0,
    };
    entriesByTour.set(key, created);
    return created;
  };

  for (const event of events) {
    const entry = entryFor(event.date, event.tourId, event.tourTitle);
    entry.availableSpots = (entry.availableSpots ?? 0) + event.availableSpots;
  }

  for (const reservation of reservations) {
    if (reservation.status === "cancelled") continue;
    const entry = entryFor(
      reservation.date,
      reservation.tourId,
      reservation.tourTitle
    );
    entry.reservations.push(reservation);
    entry.bookedGuests += reservation.partySize;
  }

  return Array.from(byDate.entries())
    .map(([date, entriesByTour]) => {
      const entries = Array.from(entriesByTour.values()).sort((a, b) =>
        a.tourTitle.localeCompare(b.tourTitle)
      );

      return {
        date,
        entries,
        bookedGuests: entries.reduce((sum, entry) => sum + entry.bookedGuests, 0),
        availableSpots: entries.reduce(
          (sum, entry) => sum + (entry.availableSpots ?? 0),
          0
        ),
        reservationCount: entries.reduce(
          (sum, entry) => sum + entry.reservations.length,
          0
        ),
        hasPending: entries.some((entry) =>
          entry.reservations.some((reservation) => reservation.status === "pending")
        ),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
