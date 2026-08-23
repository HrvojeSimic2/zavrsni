import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  EMPTY_AVAILABILITY_SUMMARY,
  normalizeTime,
  slotDurationHours,
  type AvailabilitySlot,
  type GuideAvailabilitySummary,
} from "@/lib/types/availability";

const SLOT_COLUMNS = "id, guide_id, date, start_time, end_time, note";

/** Statuses that hold a slot. A cancelled request releases it again. */
const HOLDING_STATUSES = ["pending", "confirmed"] as const;

type SlotRow = {
  id: string;
  guide_id: string;
  date: string;
  start_time: string;
  end_time: string;
  note: string | null;
};

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mapSlot(row: SlotRow, bookedIds: Set<string>): AvailabilitySlot {
  const startTime = normalizeTime(row.start_time);
  const endTime = normalizeTime(row.end_time);

  return {
    id: String(row.id),
    guideId: String(row.guide_id),
    date: String(row.date),
    startTime,
    endTime,
    note: row.note ?? null,
    durationHours: slotDurationHours(startTime, endTime),
    booked: bookedIds.has(String(row.id)),
  };
}

/**
 * Which slots in a date range are already taken.
 *
 * Scoped by date rather than by a list of slot ids: browse folds the whole
 * window for every guide at once, and passing hundreds of ids would build a
 * request URL that grows with the size of the platform.
 *
 * Read separately rather than as an embedded relation: a traveller must not be
 * able to see *who* booked a slot, only that it is gone, and selecting the
 * reservation row would put the customer's name in the payload.
 */
async function fetchHeldSlotIds(
  supabase: SupabaseClient,
  startISO: string,
  endISO: string,
  guideId?: string
): Promise<Set<string>> {
  let query = supabase
    .from("reservations")
    .select("availability_id")
    .not("availability_id", "is", null)
    .gte("date", startISO)
    .lte("date", endISO)
    .in("status", HOLDING_STATUSES as unknown as string[]);

  if (guideId) query = query.eq("guide_id", guideId);

  const { data, error } = await query;

  if (error) {
    // Better to show a slot as open and let the booking fail on the unique
    // index than to hide the guide's whole calendar over a failed side query.
    console.warn("[availability] failed to read held slots", error);
    return new Set();
  }

  return new Set(
    (data ?? [])
      .map((row) => (row as { availability_id: string | null }).availability_id)
      .filter((id): id is string => Boolean(id))
  );
}

/** Every slot a guide has in the window, taken ones included. */
export async function fetchGuideSlots(
  guideId: string,
  startISO: string,
  endISO: string
): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guide_availability")
    .select(SLOT_COLUMNS)
    .eq("guide_id", guideId)
    .gte("date", startISO)
    .lte("date", endISO)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch guide availability: ${error.message}`);
  }

  const rows = (data ?? []) as SlotRow[];
  const held = await fetchHeldSlotIds(supabase, startISO, endISO, guideId);

  return rows.map((row) => mapSlot(row, held));
}

/**
 * Availability summaries for every guide at once, for browse and the homepage.
 *
 * Two flat queries and a fold, rather than one query per guide: the browse grid
 * renders a page of guides and would otherwise fan out.
 */
export async function fetchAvailabilitySummaries(options?: {
  windowDays?: number;
}): Promise<Map<string, GuideAvailabilitySummary>> {
  const windowDays = Math.max(1, Math.min(options?.windowDays ?? 30, 365));
  const supabase = await createClient();

  const today = toISODate(new Date());
  const endISO = toISODate(addDays(new Date(), windowDays));

  const { data, error } = await supabase
    .from("guide_availability")
    .select("id, guide_id, date")
    .gte("date", today)
    .lte("date", endISO)
    .order("date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch availability: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    guide_id: string;
    date: string;
  }>;

  const held = await fetchHeldSlotIds(supabase, today, endISO);

  const summaries = new Map<string, GuideAvailabilitySummary>();

  for (const row of rows) {
    if (held.has(String(row.id))) continue;

    const guideId = String(row.guide_id);
    const date = String(row.date);
    const current = summaries.get(guideId) ?? { ...EMPTY_AVAILABILITY_SUMMARY };

    current.openSlotCount += 1;
    if (date === today) current.availableToday = true;
    if (!current.nextAvailableDate || date < current.nextAvailableDate) {
      current.nextAvailableDate = date;
    }

    summaries.set(guideId, current);
  }

  return summaries;
}

/** The guide-side view: their own slots, with who is on them. */
export type GuideScheduleSlot = AvailabilitySlot & {
  reservationId: string | null;
  customerName: string | null;
  partySize: number | null;
  status: string | null;
};

export async function fetchOwnSlots(
  supabase: SupabaseClient,
  guideId: string,
  startISO: string,
  endISO: string,
  limit = 200
): Promise<GuideScheduleSlot[]> {
  const { data, error } = await supabase
    .from("guide_availability")
    .select(SLOT_COLUMNS)
    .eq("guide_id", guideId)
    .gte("date", startISO)
    .lte("date", endISO)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) {
    console.warn("[availability] failed to load own slots", error);
    return [];
  }

  const rows = (data ?? []) as SlotRow[];

  // The guide's own view, so the customer's name is theirs to see. Scoped by
  // guide and date rather than by slot ids, for the same reason as above.
  const { data: reservationRows, error: reservationError } = await supabase
    .from("reservations")
    .select("id, availability_id, customer_name, party_size, status")
    .eq("guide_id", guideId)
    .not("availability_id", "is", null)
    .gte("date", startISO)
    .lte("date", endISO)
    .in("status", HOLDING_STATUSES as unknown as string[]);

  if (reservationError) {
    console.warn("[availability] failed to load slot bookings", reservationError);
  }

  const bySlotId = new Map<string, Record<string, unknown>>();
  for (const row of (reservationRows ?? []) as Array<Record<string, unknown>>) {
    const slotId = row.availability_id ? String(row.availability_id) : "";
    if (slotId) bySlotId.set(slotId, row);
  }

  return rows.map((row) => {
    const slotId = String(row.id);
    const reservation = bySlotId.get(slotId);
    const base = mapSlot(row, new Set(reservation ? [slotId] : []));

    return {
      ...base,
      reservationId: reservation ? String(reservation.id) : null,
      customerName: (reservation?.customer_name as string | null) ?? null,
      partySize: reservation ? Number(reservation.party_size ?? 1) : null,
      status: (reservation?.status as string | null) ?? null,
    };
  });
}
