/**
 * A block of time a guide has opened. This is the schedulable unit: a traveller
 * takes one whole slot, and the price is the guide's rate times its length.
 */
export type AvailabilitySlot = {
  id: string;
  guideId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, local to where the guide works. */
  startTime: string;
  /** HH:MM */
  endTime: string;
  /** The guide's own label for the block, if they gave one. */
  note: string | null;
  durationHours: number;
  /** True once a pending or confirmed request holds the slot. */
  booked: boolean;
};

export type GuideAvailabilitySummary = {
  availableToday: boolean;
  /** YYYY-MM-DD of the first open slot in the window, if any. */
  nextAvailableDate: string | null;
  openSlotCount: number;
};

export const EMPTY_AVAILABILITY_SUMMARY: GuideAvailabilitySummary = {
  availableToday: false,
  nextAvailableDate: null,
  openSlotCount: 0,
};

/** Postgres hands back `time` as HH:MM:SS; the UI only ever wants HH:MM. */
export function normalizeTime(value: unknown): string {
  const raw = String(value ?? "").trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (!match) return "";
  const hours = String(Math.min(23, Number(match[1]))).padStart(2, "0");
  return `${hours}:${match[2]}`;
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Slot length in hours, rounded to a quarter so `duration_hours numeric(4,2)`
 * and the price it multiplies always agree.
 */
export function slotDurationHours(startTime: string, endTime: string): number {
  const minutes = minutesOf(endTime) - minutesOf(startTime);
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 4) / 4;
}

export function formatSlotRange(slot: {
  startTime: string;
  endTime: string;
}): string {
  return `${slot.startTime} – ${slot.endTime}`;
}
