/**
 * Marks confirmed bookings whose date has passed as completed.
 *
 * Run it on a schedule (cron, Vercel Cron, GitHub Actions):
 *   npm run reservations:settle
 *
 * The app also does this opportunistically while rendering, so this script is
 * a safety net for quiet periods rather than the only mechanism. It is
 * idempotent — running it repeatedly is harmless.
 */

import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment."
  );
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const response = await fetch(
  `${SUPABASE_URL}/rest/v1/reservations?status=eq.confirmed&date=lt.${today}`,
  {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ status: "completed" }),
  }
);

if (!response.ok) {
  console.error(`Failed to settle reservations: ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const settled = await response.json();
console.log(
  settled.length === 0
    ? "Nothing to settle."
    : `Marked ${settled.length} reservation(s) completed.`
);
