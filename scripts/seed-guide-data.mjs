/**
 * Seeds slots, bookings and reviews for claimed guide profiles so the guide
 * dashboard and the public profile have real numbers to render.
 *
 * The unit is the guide: a rate, a group cap, some specialties, and blocks of
 * open time. Nothing here creates a tour.
 *
 * Usage:
 *   node scripts/seed-guide-data.mjs                      # every claimed guide
 *   node scripts/seed-guide-data.mjs --guide=me@mail.com  # one guide, by email or id
 *   node scripts/seed-guide-data.mjs --days=60            # window size (default 45)
 *   node scripts/seed-guide-data.mjs --keep-rate          # do not touch rates already set
 *   node scripts/seed-guide-data.mjs --clear              # remove seeded rows and exit
 *
 * Seeded rows are marked so re-running is idempotent and --clear is precise:
 *   reservations -> customer_email @SEED_EMAIL_DOMAIN
 *   reviews      -> id prefixed with "seed-"
 * Slots inside the window are rewritten, except any a real booking points at.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY: it writes through PostgREST as service role.
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

const SEED_EMAIL_DOMAIN = "seed.peregrine.test";
const SEED_REVIEW_PREFIX = "seed-";
const CURRENCY = "EUR";

const args = process.argv.slice(2);
const flag = (name) => args.some((arg) => arg === `--${name}`);
const option = (name, fallback) => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : fallback;
};

const WINDOW_DAYS = Math.max(7, Math.min(Number(option("days", 45)), 180));
const TARGET_GUIDE = option("guide", null);
const CLEAR_ONLY = flag("clear");
const KEEP_RATE = flag("keep-rate");

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} -> ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

const select = (path) => rest(path);
const insert = (table, rows) =>
  rest(table, {
    method: "POST",
    body: JSON.stringify(rows),
    headers: { Prefer: "return=representation" },
  });
const patch = (path, body) =>
  rest(path, { method: "PATCH", body: JSON.stringify(body) });
const remove = (path) => rest(path, { method: "DELETE" });

/** Deterministic PRNG so re-seeding produces the same dashboard. */
function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

const FIRST_NAMES = [
  "Ana", "Marko", "Lena", "Tomás", "Aiko", "Noah", "Ines", "Petar",
  "Sofia", "Lukas", "Maja", "Elena", "Ivan", "Clara", "Nikola", "Hana",
];
const LAST_NAMES = [
  "Kovač", "Novak", "Weber", "Silva", "Tanaka", "Berg", "Horvat", "Rossi",
  "Marín", "Dubois", "Nilsson", "Babić",
];

const REVIEW_COMMENTS = [
  "Easily the highlight of our trip. Relaxed pace and great local tips.",
  "Knows every corner of the city and picked spots we never would have found.",
  "Warm, funny and endlessly patient with our questions. Highly recommended.",
  "Spent the afternoon with us like a friend would, not like a script.",
  "Flexible with our schedule and changed the route when it started raining.",
  "Wonderful morning. We left with a list of places to go back to.",
  "Very well organised from the first message to the last stop.",
];

const SPECIALTIES = ["food", "nature", "culture", "adventure", "history"];

/** The blocks a real guide tends to open. */
const SLOT_SHAPES = [
  { start: "09:00", end: "12:00", note: "Jutarnja šetnja" },
  { start: "10:00", end: "14:00", note: null },
  { start: "14:00", end: "17:00", note: "Poslijepodne" },
  { start: "17:00", end: "20:00", note: "Zalazak sunca" },
];

const MEETING_POINTS = [
  "Kod Manduševca, ispred fontane",
  "Ispred glavnog ulaza u katedralu",
  "Na uglu tržnice, kod cvjećarnica",
];

function seedEmail(name, index) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}.${index}@${SEED_EMAIL_DOMAIN}`;
}

function hoursBetween(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.round(((eh * 60 + em - (sh * 60 + sm)) / 60) * 4) / 4;
}

async function resolveGuides() {
  const guides = await select(
    "guides?select=id,name,email,user_id,hourly_rate,specialties,max_group_size,default_meeting_point&user_id=not.is.null&order=name"
  );

  if (!TARGET_GUIDE) return guides;

  const needle = TARGET_GUIDE.toLowerCase();
  const match = guides.filter(
    (guide) =>
      guide.id === TARGET_GUIDE ||
      String(guide.email ?? "").toLowerCase() === needle
  );
  return match;
}

/**
 * Removes what a previous run created. Slots are cleared for the window, but a
 * slot a real (non-seed) booking points at is left alone: deleting it would
 * detach somebody's actual test booking.
 */
async function clearSeeded(guideIds, windowStartISO, windowEndISO) {
  const idList = `(${guideIds.join(",")})`;

  const seededReviews = await select(
    `reviews?select=id&guide_id=in.${idList}&id=like.${SEED_REVIEW_PREFIX}*`
  );
  if (seededReviews.length > 0) {
    await remove(`reviews?guide_id=in.${idList}&id=like.${SEED_REVIEW_PREFIX}*`);
  }

  const seededReservations = await select(
    `reservations?select=id&guide_id=in.${idList}&customer_email=like.*@${SEED_EMAIL_DOMAIN}`
  );
  if (seededReservations.length > 0) {
    await remove(
      `reservations?guide_id=in.${idList}&customer_email=like.*@${SEED_EMAIL_DOMAIN}`
    );
  }

  const slots = await select(
    `guide_availability?select=id&guide_id=in.${idList}&date=gte.${windowStartISO}&date=lte.${windowEndISO}`
  );
  const slotIds = slots.map((slot) => slot.id);

  let protectedIds = [];
  if (slotIds.length > 0) {
    const realBookings = await select(
      `reservations?select=availability_id&availability_id=in.(${slotIds.join(",")})`
    );
    protectedIds = realBookings
      .map((row) => row.availability_id)
      .filter(Boolean);
  }

  const deletable = slotIds.filter((id) => !protectedIds.includes(id));
  if (deletable.length > 0) {
    await remove(`guide_availability?id=in.(${deletable.join(",")})`);
  }

  return {
    reviews: seededReviews.length,
    reservations: seededReservations.length,
    slots: deletable.length,
    keptSlots: protectedIds.length,
  };
}

/** Gives the guide a rate, a cap and some specialties if they have none. */
async function seedGuideOffer(guide, random) {
  const update = {};

  if (!KEEP_RATE || !guide.hourly_rate) {
    update.hourly_rate = pick(random, [22, 28, 32, 35, 40, 45, 55]);
  }
  if (!guide.max_group_size || Number(guide.max_group_size) < 1) {
    update.max_group_size = pick(random, [2, 4, 6, 8, 10]);
  }
  if (!Array.isArray(guide.specialties) || guide.specialties.length === 0) {
    const shuffled = [...SPECIALTIES].sort(() => random() - 0.5);
    update.specialties = shuffled.slice(0, 1 + Math.floor(random() * 3));
  }
  if (!guide.default_meeting_point) {
    update.default_meeting_point = pick(random, MEETING_POINTS);
  }

  if (Object.keys(update).length === 0) return guide;

  await patch(`guides?id=eq.${guide.id}`, update);
  return { ...guide, ...update };
}

async function seedGuide(guide) {
  const random = makeRandom(hashSeed(guide.id));
  const offer = await seedGuideOffer(guide, random);

  const rate = Number(offer.hourly_rate ?? 0) || null;
  const maxGroup = Math.max(1, Number(offer.max_group_size ?? 6));

  const today = new Date();
  const slotRows = [];

  // Open time on roughly every other day, in both directions: the past gives
  // the dashboard its trailing numbers, the future gives travellers something
  // to ask for.
  for (let offset = -WINDOW_DAYS; offset <= WINDOW_DAYS; offset += 1) {
    const date = addDays(today, offset);
    const weekday = date.getDay();
    if (weekday === 1) continue; // the guide's day off
    if (random() > 0.55) continue;

    const shape = pick(random, SLOT_SHAPES);
    slotRows.push({
      guide_id: guide.id,
      date: toISODate(date),
      start_time: shape.start,
      end_time: shape.end,
      note: shape.note,
    });
  }

  // Unique on (guide_id, date, start_time), so drop same-key duplicates first.
  const seen = new Set();
  const uniqueSlots = slotRows.filter((row) => {
    const key = `${row.date}:${row.start_time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const insertedSlots =
    uniqueSlots.length > 0 ? await insert("guide_availability", uniqueSlots) : [];

  const todayISO = toISODate(today);
  const reservationRows = [];
  const reviewRows = [];

  for (const slot of insertedSlots) {
    const isPast = slot.date < todayISO;
    const roll = random();

    // Past slots mostly happened; upcoming ones are a mix of asked and agreed.
    if (isPast && roll > 0.65) continue;
    if (!isPast && roll > 0.45) continue;

    const partySize = 1 + Math.floor(random() * Math.min(maxGroup, 4));
    const name = `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`;
    const hours = hoursBetween(slot.start_time.slice(0, 5), slot.end_time.slice(0, 5));
    const status = isPast
      ? "completed"
      : random() > 0.45
        ? "confirmed"
        : "pending";

    reservationRows.push({
      guide_id: guide.id,
      availability_id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_hours: hours,
      hourly_rate: rate,
      party_size: partySize,
      status,
      customer_name: name,
      customer_email: seedEmail(name, reservationRows.length),
      total_amount: rate ? Number((rate * hours).toFixed(2)) : null,
      currency: CURRENCY,
      meeting_point: offer.default_meeting_point ?? null,
      note: null,
    });

    // Most finished bookings leave a review — about the guide, not a product.
    if (status === "completed" && random() > 0.3) {
      reviewRows.push({
        id: `${SEED_REVIEW_PREFIX}${guide.id}-${slot.id}`.slice(0, 60),
        guide_id: guide.id,
        author: name,
        avatar: "/placeholder-user.jpg",
        rating: 4 + Math.round(random()),
        date: slot.date,
        comment: pick(random, REVIEW_COMMENTS),
      });
    }
  }

  if (reservationRows.length > 0) await insert("reservations", reservationRows);
  if (reviewRows.length > 0) await insert("reviews", reviewRows);

  // guides.rating / review_count are maintained by the refresh_guide_rating
  // trigger, so there is nothing to patch here.

  return {
    guide: guide.name,
    rate,
    maxGroup,
    slots: insertedSlots.length,
    bookings: reservationRows.length,
    reviews: reviewRows.length,
  };
}

async function main() {
  const guides = await resolveGuides();

  if (guides.length === 0) {
    console.error(
      "No claimed guide profiles found. Claim a guide profile first (guides.user_id must be set)."
    );
    process.exit(1);
  }

  const guideIds = guides.map((guide) => guide.id);
  const today = new Date();
  const windowStartISO = toISODate(addDays(today, -WINDOW_DAYS));
  const windowEndISO = toISODate(addDays(today, WINDOW_DAYS));

  const cleared = await clearSeeded(guideIds, windowStartISO, windowEndISO);
  console.log(
    `Cleared ${cleared.reservations} booking(s), ${cleared.reviews} review(s), ${cleared.slots} slot(s)` +
      (cleared.keptSlots > 0
        ? ` — kept ${cleared.keptSlots} slot(s) with real bookings on them.`
        : ".")
  );

  if (CLEAR_ONLY) return;

  for (const guide of guides) {
    const result = await seedGuide(guide);
    console.log(
      `${result.guide}: ${result.slots} slot(s), ${result.bookings} booking(s), ` +
        `${result.reviews} review(s), ${result.rate ?? "no"} EUR/h, up to ${result.maxGroup} people`
    );
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
