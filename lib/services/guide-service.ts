import { createClient } from "@/lib/supabase/server";
import type { GuideBrowseItem, GuideInterest } from "@/lib/types/guide";
import type { TourCategory } from "@/lib/types/tour";

type GuideRow = {
  id: string;
  name: string;
  avatar: string | null;
  languages: string[] | null;
  verified: boolean | null;
  location: string | null;
  email?: string | null;
  phone?: string | null;
  headline?: string | null;
  bio?: string | null;
  years_experience?: number | null;
  website?: string | null;
};

export type GuideProfileTour = {
  id: string;
  title: string;
  category: TourCategory;
  location: string | null;
  country: string | null;
  price: number | null;
  duration: string | null;
  image: string | null;
  rating: number;
  reviewCount: number;
};

export type GuideProfileReview = {
  id: string;
  author: string;
  avatar: string | null;
  rating: number;
  date: string;
  comment: string;
  tourTitle: string | null;
};

type TourRow = {
  id: string;
  title: string;
  category: TourCategory;
  location: string;
  country: string;
  rating: number | null;
  review_count: number | null;
  guide_id: string | null;
};

type AvailabilityRow = {
  tour_id: string;
  date: string;
  available_spots: number | null;
};

function toISODate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatPlace(location: string, country: string) {
  const left = String(location ?? "").trim();
  const right = String(country ?? "").trim();
  if (left && right) return `${left}, ${right}`;
  return left || right || "";
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

export async function fetchGuidesBrowseItems(options?: {
  windowDays?: number;
}): Promise<GuideBrowseItem[]> {
  const windowDays = Math.max(1, Math.min(options?.windowDays ?? 30, 365));
  const supabase = await createClient();

  const now = new Date();
  const startISO = toISODate(now);
  const endISO = toISODate(addDays(now, windowDays));

  const [{ data: guideRows, error: guideError }, { data: tourRows, error: tourError }, { data: availabilityRows, error: availabilityError }] =
    await Promise.all([
      supabase
        .from("guides")
        .select("id, name, avatar, languages, verified, location")
        .order("name", { ascending: true }),
      supabase
        .from("tours")
        .select(
          "id, title, category, location, country, rating, review_count, guide_id"
        )
        .not("guide_id", "is", null),
      supabase
        .from("tour_availability")
        .select("tour_id, date, available_spots")
        .gte("date", startISO)
        .lte("date", endISO)
        .gt("available_spots", 0),
    ]);

  if (guideError) {
    throw new Error(`Failed to fetch guides: ${guideError.message}`);
  }
  if (tourError) {
    throw new Error(`Failed to fetch tours for guides: ${tourError.message}`);
  }
  if (availabilityError) {
    throw new Error(
      `Failed to fetch guide availability: ${availabilityError.message}`
    );
  }

  const guides = (guideRows ?? []) as GuideRow[];
  const tours = (tourRows ?? []) as TourRow[];
  const availability = (availabilityRows ?? []) as AvailabilityRow[];

  const toursByGuideId = new Map<string, TourRow[]>();
  const tourGuideIdByTourId = new Map<string, string>();

  for (const tour of tours) {
    const guideId = tour.guide_id;
    if (!guideId) continue;
    tourGuideIdByTourId.set(tour.id, guideId);
    const list = toursByGuideId.get(guideId) ?? [];
    list.push(tour);
    toursByGuideId.set(guideId, list);
  }

  const availabilityByGuideId = new Map<
    string,
    { availableToday: boolean; nextAvailableDate: string | null }
  >();

  for (const day of availability) {
    const guideId = tourGuideIdByTourId.get(day.tour_id);
    if (!guideId) continue;

    const entry =
      availabilityByGuideId.get(guideId) ?? {
        availableToday: false,
        nextAvailableDate: null,
      };

    if (day.date === startISO) entry.availableToday = true;
    if (!entry.nextAvailableDate || day.date < entry.nextAvailableDate) {
      entry.nextAvailableDate = day.date;
    }

    availabilityByGuideId.set(guideId, entry);
  }

  return guides.map((guide) => {
    const guideTours = toursByGuideId.get(guide.id) ?? [];

    const interests = unique(
      guideTours.map((tour) => tour.category).filter(Boolean)
    ) as GuideInterest[];

    const ratingNumerator = guideTours.reduce((sum, tour) => {
      const rating = tour.rating ?? 0;
      const count = tour.review_count ?? 0;
      return sum + rating * count;
    }, 0);

    const reviewCount = guideTours.reduce(
      (sum, tour) => sum + (tour.review_count ?? 0),
      0
    );

    const rating =
      reviewCount > 0 ? ratingNumerator / reviewCount : guideTours.length > 0
        ? guideTours.reduce((sum, tour) => sum + (tour.rating ?? 0), 0) /
          guideTours.length
        : 0;

    const derivedPlace =
      guideTours.length > 0
        ? formatPlace(guideTours[0].location, guideTours[0].country)
        : "";

    const location =
      normalizeText(guide.location) || normalizeText(derivedPlace) || "—";

    const availabilitySummary = availabilityByGuideId.get(guide.id);

    return {
      id: guide.id,
      name: guide.name,
      avatar: guide.avatar,
      languages: guide.languages ?? [],
      verified: guide.verified ?? false,
      location,
      interests,
      rating: Number.isFinite(rating) ? Number(rating.toFixed(2)) : 0,
      reviewCount,
      availableToday: availabilitySummary?.availableToday ?? false,
      nextAvailableDate: availabilitySummary?.nextAvailableDate ?? null,
    };
  });
}

const GUIDE_PROFILE_COLUMNS =
  "id, name, avatar, languages, verified, location, headline, bio, years_experience, website";

const GUIDE_BASE_COLUMNS =
  "id, name, avatar, languages, verified, location";

export async function fetchGuideProfile(guideId: string): Promise<{
  guide: GuideRow | null;
  interests: GuideInterest[];
  rating: number;
  reviewCount: number;
  availableToday: boolean;
  nextAvailableDate: string | null;
  tours: GuideProfileTour[];
  reviews: GuideProfileReview[];
}> {
  const supabase = await createClient();

  const [{ data: guide, error: guideError }, { data: tours, error: toursError }] =
    await Promise.all([
      supabase
        .from("guides")
        .select(GUIDE_PROFILE_COLUMNS)
        .eq("id", guideId)
        .maybeSingle(),
      supabase
        .from("tours")
        .select(
          "id, title, category, location, country, price, duration, image, rating, review_count, guide_id"
        )
        .eq("guide_id", guideId)
        .order("rating", { ascending: false }),
    ]);

  let guideData: Record<string, unknown> | null = guide;

  // The profile columns arrive in a later migration; fall back to the base
  // columns so an un-migrated database still renders the profile.
  if (guideError?.code === "42703") {
    console.warn(
      "[guide.profile] guides is missing the profile columns. Apply supabase/migrations/20260812120000_add_guide_profile_fields.sql."
    );
    const fallback = await supabase
      .from("guides")
      .select(GUIDE_BASE_COLUMNS)
      .eq("id", guideId)
      .maybeSingle();

    if (fallback.error) {
      throw new Error(`Failed to fetch guide: ${fallback.error.message}`);
    }
    guideData = fallback.data;
  } else if (guideError) {
    throw new Error(`Failed to fetch guide: ${guideError.message}`);
  }

  if (toursError) {
    throw new Error(`Failed to fetch guide tours: ${toursError.message}`);
  }

  const guideRow = (guideData ?? null) as GuideRow | null;

  const tourRows =
    (tours ?? []) as Array<{
      id: string;
      title: string;
      category: TourCategory;
      location: string | null;
      country: string | null;
      price: number | null;
      duration: string | null;
      image: string | null;
      rating: number | null;
      review_count: number | null;
      guide_id: string | null;
    }>;

  const interests = unique(
    tourRows.map((tour) => tour.category).filter(Boolean)
  ) as GuideInterest[];

  const ratingNumerator = tourRows.reduce((sum, tour) => {
    const rating = tour.rating ?? 0;
    const count = tour.review_count ?? 0;
    return sum + rating * count;
  }, 0);

  const reviewCount = tourRows.reduce(
    (sum, tour) => sum + (tour.review_count ?? 0),
    0
  );

  const rating =
    reviewCount > 0
      ? ratingNumerator / reviewCount
      : tourRows.length > 0
        ? tourRows.reduce((sum, tour) => sum + (tour.rating ?? 0), 0) /
          tourRows.length
        : 0;

  const now = new Date();
  const startISO = toISODate(now);
  const endISO = toISODate(addDays(now, 30));

  const tourIds = tourRows.map((t) => t.id);
  let availableToday = false;
  let nextAvailableDate: string | null = null;

  if (tourIds.length > 0) {
    const { data: availability, error: availabilityError } = await supabase
      .from("tour_availability")
      .select("tour_id, date, available_spots")
      .in("tour_id", tourIds)
      .gte("date", startISO)
      .lte("date", endISO)
      .gt("available_spots", 0)
      .order("date", { ascending: true });

    if (availabilityError) {
      throw new Error(
        `Failed to fetch guide availability: ${availabilityError.message}`
      );
    }

    for (const row of (availability ?? []) as AvailabilityRow[]) {
      if (row.date === startISO) availableToday = true;
      if (!nextAvailableDate || row.date < nextAvailableDate) {
        nextAvailableDate = row.date;
      }
    }
  }

  const profileTours: GuideProfileTour[] = tourRows.map((tour) => ({
    id: tour.id,
    title: tour.title,
    category: tour.category,
    location: tour.location,
    country: tour.country,
    price: tour.price,
    duration: tour.duration,
    image: tour.image,
    rating: tour.rating ?? 0,
    reviewCount: tour.review_count ?? 0,
  }));

  const titleByTourId = new Map(profileTours.map((tour) => [tour.id, tour.title]));

  let reviews: GuideProfileReview[] = [];

  if (tourIds.length > 0) {
    const { data: reviewRows, error: reviewsError } = await supabase
      .from("reviews")
      .select("id, tour_id, author, avatar, rating, date, comment")
      .in("tour_id", tourIds)
      .order("date", { ascending: false })
      .limit(6);

    if (reviewsError) {
      console.warn("[guide.profile] failed to fetch reviews", reviewsError);
    } else {
      reviews = (reviewRows ?? []).map((review) => ({
        id: String(review.id),
        author: String(review.author ?? "Traveller"),
        avatar: (review.avatar as string | null) ?? null,
        rating: Number(review.rating ?? 0),
        date: String(review.date ?? ""),
        comment: String(review.comment ?? ""),
        tourTitle: titleByTourId.get(String(review.tour_id)) ?? null,
      }));
    }
  }

  return {
    guide: guideRow,
    interests,
    rating: Number.isFinite(rating) ? Number(rating.toFixed(2)) : 0,
    reviewCount,
    availableToday,
    nextAvailableDate,
    tours: profileTours,
    reviews,
  };
}

