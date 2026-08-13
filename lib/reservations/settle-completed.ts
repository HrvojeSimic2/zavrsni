import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A confirmed booking whose date has passed has happened. Nothing in the app
 * marks that, so the trailing-revenue metric and any future "leave a review"
 * flow would never see a completed tour.
 *
 * This is one filtered UPDATE, so the cost does not grow with the number of
 * rows it settles, and it is idempotent: running it twice changes nothing.
 * It uses the admin client because the transition belongs to neither party —
 * it is the passage of time, not an action by a guide or a traveller.
 */
export async function settleCompletedReservations(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reservations")
    .update({ status: "completed" })
    .eq("status", "confirmed")
    .lt("date", today)
    .select("id");

  if (error) {
    console.warn("[reservations.settle] failed to settle reservations", error);
    return 0;
  }

  const settled = data?.length ?? 0;
  if (settled > 0) {
    console.info(`[reservations.settle] marked ${settled} reservation(s) completed`);
  }
  return settled;
}

/** Throttle window for the opportunistic call made while rendering pages. */
const MIN_INTERVAL_MS = 5 * 60 * 1000;
let lastRunAt = 0;

/**
 * Best-effort settle triggered by page traffic, so the app stays correct
 * without a scheduler configured. Throttled per server instance and never
 * allowed to fail a render — a real deployment should also run
 * `npm run reservations:settle` on a schedule.
 */
export async function settleCompletedReservationsThrottled(): Promise<void> {
  const now = Date.now();
  if (now - lastRunAt < MIN_INTERVAL_MS) return;
  lastRunAt = now;

  try {
    await settleCompletedReservations();
  } catch (error) {
    console.warn("[reservations.settle] skipped", error);
  }
}
