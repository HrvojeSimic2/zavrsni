import type { GuideReservation, GuideSlot } from "@/lib/guide/guide-dashboard-data";

export type GuideScheduleEntry = {
  slotId: string | null;
  startTime: string | null;
  endTime: string | null;
  durationHours: number | null;
  note: string | null;
  reservations: GuideReservation[];
  bookedGuests: number;
  /** True while nobody holds this block. */
  open: boolean;
};

export type GuideScheduleDay = {
  date: string;
  entries: GuideScheduleEntry[];
  bookedGuests: number;
  openSlots: number;
  reservationCount: number;
  hasPending: boolean;
};

/**
 * Merges opened slots and reservations into one day-by-day schedule.
 *
 * A day appears if it has a slot, a reservation, or both; within a day the two
 * are joined per slot, so a guide reads their calendar as "this block is free,
 * this block is Ana at 14:00" instead of two disconnected lists.
 *
 * Reservations made before slots existed carry no `slotId`; they still show up,
 * keyed by their own time, rather than silently vanishing from the schedule.
 */
export function buildGuideSchedule(
  slots: GuideSlot[],
  reservations: GuideReservation[]
): GuideScheduleDay[] {
  const byDate = new Map<string, Map<string, GuideScheduleEntry>>();

  const entryFor = (
    date: string,
    key: string,
    seed: Omit<GuideScheduleEntry, "reservations" | "bookedGuests">
  ) => {
    const entries = byDate.get(date) ?? new Map<string, GuideScheduleEntry>();
    byDate.set(date, entries);

    const existing = entries.get(key);
    if (existing) return existing;

    const created: GuideScheduleEntry = {
      ...seed,
      reservations: [],
      bookedGuests: 0,
    };
    entries.set(key, created);
    return created;
  };

  for (const slot of slots) {
    entryFor(slot.date, slot.id, {
      slotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationHours: slot.durationHours,
      note: slot.note,
      open: !slot.booked,
    });
  }

  for (const reservation of reservations) {
    if (reservation.status === "cancelled") continue;

    const key = reservation.slotId ?? `legacy:${reservation.startTime ?? "—"}`;
    const entry = entryFor(reservation.date, key, {
      slotId: reservation.slotId,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      durationHours: reservation.durationHours,
      note: null,
      open: false,
    });

    entry.open = false;
    entry.reservations.push(reservation);
    entry.bookedGuests += reservation.partySize;
  }

  return Array.from(byDate.entries())
    .map(([date, entries]) => {
      const ordered = Array.from(entries.values()).sort((a, b) =>
        String(a.startTime ?? "").localeCompare(String(b.startTime ?? ""))
      );

      return {
        date,
        entries: ordered,
        bookedGuests: ordered.reduce((sum, entry) => sum + entry.bookedGuests, 0),
        openSlots: ordered.filter((entry) => entry.open).length,
        reservationCount: ordered.reduce(
          (sum, entry) => sum + entry.reservations.length,
          0
        ),
        hasPending: ordered.some((entry) =>
          entry.reservations.some((reservation) => reservation.status === "pending")
        ),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
