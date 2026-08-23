import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  fetchAvailabilitySummaries,
  fetchGuideSlots,
  toISODate,
} from "@/lib/services/availability-service";
import type { AvailabilitySlot } from "@/lib/types/availability";
import { EMPTY_AVAILABILITY_SUMMARY } from "@/lib/types/availability";
import type { GuideBrowseItem, GuideInterest } from "@/lib/types/guide";
import { toSpecialties } from "@/lib/types/specialty";

/** How far ahead the public side looks for open slots. */
export const AVAILABILITY_WINDOW_DAYS = 60;

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
  hourly_rate?: number | null;
  specialties?: string[] | null;
  max_group_size?: number | null;
  default_meeting_point?: string | null;
  rating?: number | null;
  review_count?: number | null;
};

export type GuideProfileReview = {
  id: string;
  author: string;
  avatar: string | null;
  rating: number;
  date: string;
  comment: string;
};

const BROWSE_COLUMNS =
  "id, name, avatar, languages, verified, location, hourly_rate, specialties, max_group_size, rating, review_count";

const PROFILE_COLUMNS =
  "id, name, avatar, languages, verified, location, headline, bio, years_experience, website, hourly_rate, specialties, max_group_size, default_meeting_point, rating, review_count";

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function toRate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toGroupSize(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 6;
}

/**
 * The browse grid: one query for the guides, one fold over the availability
 * window. Nothing here touches tours — a guide's specialties, rate and rating
 * are their own columns, so a guide with an empty calendar still lists.
 */
export async function fetchGuidesBrowseItems(options?: {
  windowDays?: number;
}): Promise<GuideBrowseItem[]> {
  const supabase = await createClient();

  const [{ data: guideRows, error: guideError }, summaries] = await Promise.all([
    supabase
      .from("guides")
      .select(BROWSE_COLUMNS)
      .order("name", { ascending: true }),
    fetchAvailabilitySummaries({
      windowDays: options?.windowDays ?? AVAILABILITY_WINDOW_DAYS,
    }),
  ]);

  if (guideError) {
    throw new Error(`Failed to fetch guides: ${guideError.message}`);
  }

  return ((guideRows ?? []) as GuideRow[]).map((guide) => {
    const summary = summaries.get(guide.id) ?? EMPTY_AVAILABILITY_SUMMARY;

    return {
      id: guide.id,
      name: guide.name,
      avatar: guide.avatar,
      languages: guide.languages ?? [],
      verified: guide.verified ?? false,
      location: normalizeText(guide.location) || "—",
      interests: toSpecialties(guide.specialties) as GuideInterest[],
      rating: Number(guide.rating ?? 0),
      reviewCount: Number(guide.review_count ?? 0),
      hourlyRate: toRate(guide.hourly_rate),
      maxGroupSize: toGroupSize(guide.max_group_size),
      availableToday: summary.availableToday,
      nextAvailableDate: summary.nextAvailableDate,
      openSlotCount: summary.openSlotCount,
    };
  });
}

export type GuideProfileData = {
  guide: GuideRow | null;
  interests: GuideInterest[];
  rating: number;
  reviewCount: number;
  hourlyRate: number | null;
  maxGroupSize: number;
  availableToday: boolean;
  nextAvailableDate: string | null;
  slots: AvailabilitySlot[];
  reviews: GuideProfileReview[];
};

export async function fetchGuideProfile(
  guideId: string
): Promise<GuideProfileData> {
  const supabase = await createClient();

  const today = toISODate(new Date());
  const windowEnd = toISODate(addDays(new Date(), AVAILABILITY_WINDOW_DAYS));

  const [{ data: guide, error: guideError }, slots, { data: reviewRows, error: reviewsError }] =
    await Promise.all([
      supabase
        .from("guides")
        .select(PROFILE_COLUMNS)
        .eq("id", guideId)
        .maybeSingle(),
      fetchGuideSlots(guideId, today, windowEnd).catch((error) => {
        console.warn("[guide.profile] failed to load slots", error);
        return [] as AvailabilitySlot[];
      }),
      supabase
        .from("reviews")
        .select("id, author, avatar, rating, date, comment")
        .eq("guide_id", guideId)
        .order("date", { ascending: false })
        .limit(6),
    ]);

  if (guideError) {
    throw new Error(`Failed to fetch guide: ${guideError.message}`);
  }
  if (reviewsError) {
    console.warn("[guide.profile] failed to fetch reviews", reviewsError);
  }

  const guideRow = (guide ?? null) as GuideRow | null;
  const openSlots = slots.filter((slot) => !slot.booked);

  const reviews: GuideProfileReview[] = (reviewRows ?? []).map((review) => ({
    id: String(review.id),
    author: String(review.author ?? "Traveller"),
    avatar: (review.avatar as string | null) ?? null,
    rating: Number(review.rating ?? 0),
    date: String(review.date ?? ""),
    comment: String(review.comment ?? ""),
  }));

  return {
    guide: guideRow,
    interests: toSpecialties(guideRow?.specialties) as GuideInterest[],
    rating: Number(guideRow?.rating ?? 0),
    reviewCount: Number(guideRow?.review_count ?? 0),
    hourlyRate: toRate(guideRow?.hourly_rate),
    maxGroupSize: toGroupSize(guideRow?.max_group_size),
    availableToday: openSlots.some((slot) => slot.date === today),
    nextAvailableDate: openSlots[0]?.date ?? null,
    slots,
    reviews,
  };
}
