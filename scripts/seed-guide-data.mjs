/**
 * Seeds availability, reservations and reviews for claimed guide profiles so the
 * guide dashboard has real numbers to render.
 *
 * Usage:
 *   node scripts/seed-guide-data.mjs                      # all claimed guides that own tours
 *   node scripts/seed-guide-data.mjs --guide=me@mail.com  # one guide, by email or id
 *   node scripts/seed-guide-data.mjs --days=60            # window size (default 45)
 *   node scripts/seed-guide-data.mjs --demo-tours         # also add two extra tours per guide
 *   node scripts/seed-guide-data.mjs --clear              # remove seeded rows and exit
 *
 * Seeded rows are marked so re-running is idempotent and --clear is precise:
 *   reservations -> customer_email @SEED_EMAIL_DOMAIN
 *   reviews      -> id prefixed with "seed-"
 *   tours        -> id-independent, matched by the "[seed]" marker in description
 * Availability is rewritten for the seeded tours inside the window.
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

const SEED_EMAIL_DOMAIN = "seed.localpath.test";
const SEED_REVIEW_PREFIX = "seed-";
const SEED_TOUR_MARKER = "[seed]";
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
const WITH_DEMO_TOURS = flag("demo-tours");

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

function parseCapacity(groupSize) {
  const match = String(groupSize ?? "").match(/\d+/g);
  if (!match) return 8;
  const largest = Math.max(...match.map(Number));
  return Number.isFinite(largest) && largest > 0 ? Math.min(largest, 20) : 8;
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
  "Great value and a genuinely local experience, not a tourist script.",
  "Flexible with our schedule and adapted the route when it started raining.",
  "Wonderful morning. We left with a list of places to go back to.",
  "Very well organised from the first message to the last stop.",
];

async function resolveGuides() {
  const guides = await select(
    "guides?select=id,name,email,user_id&user_id=not.is.null&order=name"
  );

  if (!TARGET_GUIDE) return guides;

  const needle = TARGET_GUIDE.trim().toLowerCase();
  const match = guides.filter(
    (guide) =>
      guide.id === TARGET_GUIDE ||
      String(guide.email ?? "").toLowerCase() === needle
  );

  if (match.length === 0) {
    throw new Error(
      `No claimed guide matches "${TARGET_GUIDE}". A guide must have user_id set (profile claimed).`
    );
  }
  return match;
}

async function clearSeedData(guideIds) {
  const idList = `(${guideIds.join(",")})`;

  const seededReservations = await select(
    `reservations?select=id&guide_id=in.${idList}&customer_email=like.*@${SEED_EMAIL_DOMAIN}`
  );
  if (seededReservations.length > 0) {
    await remove(
      `reservations?guide_id=in.${idList}&customer_email=like.*@${SEED_EMAIL_DOMAIN}`
    );
  }

  const tours = await select(`tours?select=id,description&guide_id=in.${idList}`);
  const tourIds = tours.map((tour) => tour.id);
  const seededTourIds = tours
    .filter((tour) => String(tour.description ?? "").includes(SEED_TOUR_MARKER))
    .map((tour) => tour.id);

  let seededReviews = [];
  if (tourIds.length > 0) {
    seededReviews = await select(
      `reviews?select=id&tour_id=in.(${tourIds.join(",")})&id=like.${SEED_REVIEW_PREFIX}*`
    );
    if (seededReviews.length > 0) {
      await remove(
        `reviews?tour_id=in.(${tourIds.join(",")})&id=like.${SEED_REVIEW_PREFIX}*`
      );
    }
    await remove(`tour_availability?tour_id=in.(${tourIds.join(",")})`);
  }

  if (seededTourIds.length > 0) {
    await remove(`tours?id=in.(${seededTourIds.join(",")})`);
  }

  return {
    reservations: seededReservations.length,
    reviews: seededReviews.length,
    tours: seededTourIds.length,
    availabilityTours: tourIds.length,
  };
}

const DEMO_TOURS = [
  {
    title: "Skrivene ulice Gornjeg grada",
    category: "history",
    price: 34,
    duration: "2-3 sata",
    group_size: "8",
    highlights: ["Kula Lotrščak", "Kamenita vrata", "Priče starog Zagreba"],
  },
  {
    title: "Dolac market food walk",
    category: "food",
    price: 52,
    duration: "3-4 sata",
    group_size: "6",
    highlights: ["Dolac market", "Local cheese and štrukli", "Craft beer stop"],
  },
];

async function createDemoTours(guide, existingTour) {
  const rows = DEMO_TOURS.map((tour) => ({
    ...tour,
    description: `${SEED_TOUR_MARKER} Demo tour created by scripts/seed-guide-data.mjs.`,
    location: existingTour?.location ?? "Zagreb",
    country: existingTour?.country ?? "Hrvatska",
    image: existingTour?.image ?? null,
    rating: 0,
    review_count: 0,
    guide_id: guide.id,
  }));

  return insert("tours", rows);
}

async function seedGuide(guide) {
  let tours = await select(
    "tours?select=id,title,price,group_size,location,country,image&guide_id=eq." + guide.id
  );

  if (tours.length === 0) {
    return { skipped: true };
  }

  if (WITH_DEMO_TOURS) {
    const created = await createDemoTours(guide, tours[0]);
    tours = tours.concat(created);
  }

  const random = makeRandom(hashSeed(guide.id));
  const today = new Date();
  const todayISO = toISODate(today);

  const availabilityRows = [];
  const reservationRows = [];
  const reviewRows = [];

  for (const tour of tours) {
    const capacity = parseCapacity(tour.group_size);
    const price = Number(tour.price ?? 0);

    // Future: availability with bookings layered on top.
    for (let offset = 0; offset < WINDOW_DAYS; offset += 1) {
      const date = addDays(today, offset);
      const weekday = date.getDay();

      // Roughly half the days are offered, weekends more often than weekdays.
      const threshold = weekday === 0 || weekday === 6 ? 0.75 : 0.4;
      if (random() > threshold) continue;

      const dateISO = toISODate(date);
      let booked = 0;
      const bookingCount = random() < 0.55 ? (random() < 0.35 ? 2 : 1) : 0;

      for (let i = 0; i < bookingCount; i += 1) {
        const partySize = Math.min(
          1 + Math.floor(random() * 3),
          Math.max(capacity - booked, 0)
        );
        if (partySize <= 0) break;
        booked += partySize;

        // Dates close to today are mostly settled; further out still pending.
        const status =
          offset <= 3 ? "confirmed" : random() < 0.28 ? "pending" : "confirmed";

        const first = pick(random, FIRST_NAMES);
        const last = pick(random, LAST_NAMES);

        reservationRows.push({
          guide_id: guide.id,
          tour_id: tour.id,
          date: dateISO,
          party_size: partySize,
          status,
          customer_name: `${first} ${last}`,
          customer_email: `${first.toLowerCase()}.${i}${offset}@${SEED_EMAIL_DOMAIN}`,
          note: "Seeded demo booking.",
          total_amount: Number((price * partySize).toFixed(2)),
          currency: CURRENCY,
        });
      }

      availabilityRows.push({
        tour_id: tour.id,
        date: dateISO,
        available_spots: Math.max(capacity - booked, 0),
      });
    }

    // Past 30 days: completed and a few cancelled bookings drive trailing metrics.
    for (let offset = 1; offset <= 30; offset += 1) {
      if (random() > 0.45) continue;

      const dateISO = toISODate(addDays(today, -offset));
      const partySize = 1 + Math.floor(random() * 3);
      const status = random() < 0.15 ? "cancelled" : "completed";
      const first = pick(random, FIRST_NAMES);
      const last = pick(random, LAST_NAMES);

      reservationRows.push({
        guide_id: guide.id,
        tour_id: tour.id,
        date: dateISO,
        party_size: partySize,
        status,
        customer_name: `${first} ${last}`,
        customer_email: `${first.toLowerCase()}.p${offset}@${SEED_EMAIL_DOMAIN}`,
        note: "Seeded demo booking.",
        total_amount: Number((price * partySize).toFixed(2)),
        currency: CURRENCY,
      });

      // Most completed tours leave a review.
      if (status === "completed" && random() < 0.5) {
        reviewRows.push({
          id: `${SEED_REVIEW_PREFIX}${tour.id.slice(0, 8)}-${offset}`,
          tour_id: tour.id,
          author: `${first} ${last}`,
          // reviews.avatar is NOT NULL, so fall back to the shared placeholder.
          avatar: "/placeholder.svg",
          rating: random() < 0.72 ? 5 : 4,
          date: dateISO,
          comment: pick(random, REVIEW_COMMENTS),
          helpful: Math.floor(random() * 12),
        });
      }
    }
  }

  if (availabilityRows.length > 0) await insert("tour_availability", availabilityRows);
  if (reservationRows.length > 0) await insert("reservations", reservationRows);
  if (reviewRows.length > 0) await insert("reviews", reviewRows);

  // Keep tours.rating / review_count consistent with the seeded reviews, since
  // the guide rating metric and the browse listing both read from tours.
  for (const tour of tours) {
    const tourReviews = reviewRows.filter((review) => review.tour_id === tour.id);
    if (tourReviews.length === 0) continue;

    const average =
      tourReviews.reduce((sum, review) => sum + review.rating, 0) / tourReviews.length;

    await patch(`tours?id=eq.${tour.id}`, {
      rating: Number(average.toFixed(2)),
      review_count: tourReviews.length,
    });
  }

  const upcoming = reservationRows.filter((row) => row.date >= todayISO);
  const revenue = upcoming
    .filter((row) => row.status !== "cancelled")
    .reduce((sum, row) => sum + row.total_amount, 0);

  return {
    tours: tours.length,
    availability: availabilityRows.length,
    reservations: reservationRows.length,
    upcoming: upcoming.length,
    reviews: reviewRows.length,
    revenue,
  };
}

async function main() {
  const guides = await resolveGuides();

  if (guides.length === 0) {
    console.log(
      "No claimed guide profiles found. Claim a guide profile first (guides.user_id must be set)."
    );
    return;
  }

  const guideIds = guides.map((guide) => guide.id);
  const cleared = await clearSeedData(guideIds);
  console.log(
    `Cleared previous seed data: ${cleared.reservations} reservations, ${cleared.reviews} reviews, ${cleared.tours} demo tours, availability for ${cleared.availabilityTours} tours.`
  );

  if (CLEAR_ONLY) {
    console.log("--clear given, stopping here.");
    return;
  }

  for (const guide of guides) {
    const result = await seedGuide(guide);

    if (result.skipped) {
      console.log(`- ${guide.name}: no tours, skipped.`);
      continue;
    }

    console.log(
      `- ${guide.name}: ${result.availability} available dates, ${result.reservations} reservations (${result.upcoming} upcoming), ${result.reviews} reviews, ${result.revenue.toFixed(2)} ${CURRENCY} booked across ${result.tours} tour(s).`
    );
  }

  console.log("\nDone. Open /guide to see the dashboard.");
}

main().catch((error) => {
  console.error("\nSeeding failed:", error.message);
  process.exit(1);
});
