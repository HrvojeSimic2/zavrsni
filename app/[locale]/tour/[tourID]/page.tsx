import { notFound } from "next/navigation";

import TourDetailClient, {
  type GuideStory,
  type GuideTour,
} from "@/components/tour/tour-detail-client";
import { fetchSimilarTours, fetchTourById } from "@/lib/services/tour-service";
import { fetchReviewsByTourId } from "@/lib/services/review-service";
import { fetchGuideProfile } from "@/lib/services/guide-service";

/**
 * The guide's own words, plus their other tours.
 *
 * The tour row only carries a name and an avatar, which is not enough to lead a
 * page with the person rather than the product. Reads the same public profile
 * columns `/guides/[id]` renders — never the contact columns, which stay behind
 * a confirmed booking — and narrows them to what the page actually shows so
 * nothing extra rides along in the RSC payload.
 */
async function loadGuideStory(
  guideId: string,
  currentTourId: string
): Promise<{ story: GuideStory | null; tours: GuideTour[] }> {
  if (!guideId) return { story: null, tours: [] };

  try {
    const profile = await fetchGuideProfile(guideId);
    const guide = profile.guide;

    const otherTours = profile.tours
      .filter((tour) => tour.id !== currentTourId)
      .map((tour) => ({
        id: tour.id,
        title: tour.title,
        description: tour.description,
        image: tour.image,
        category: tour.category,
        location: tour.location,
        country: tour.country,
        duration: tour.duration,
        price: tour.price,
      }));

    return {
      story: guide
        ? {
            headline: guide.headline ?? null,
            bio: guide.bio ?? null,
            yearsExperience: guide.years_experience ?? null,
            homeBase: guide.location ?? null,
            tourCount: profile.tours.length,
          }
        : null,
      tours: otherTours,
    };
  } catch (error) {
    // The guide's story enriches the page; it must not be able to 500 it.
    console.warn("[tour.detail] failed to load guide story", error);
    return { story: null, tours: [] };
  }
}

export default async function TourDetailPage({
  params,
}: {
  params: { locale: string; tourID: string } | Promise<{ locale: string; tourID: string }>;
}) {
  const { locale, tourID } = await Promise.resolve(params);

  const tour = await fetchTourById(tourID);
  if (!tour) notFound();

  const [similarTours, reviews, guide] = await Promise.all([
    fetchSimilarTours(tour.category, tour.id).catch(() => []),
    // Reviews are secondary to the page: a failure here should not 500 a tour.
    fetchReviewsByTourId(tour.id).catch((error) => {
      console.warn("[tour.detail] failed to load reviews", error);
      return [];
    }),
    loadGuideStory(tour.guide.id, tour.id),
  ]);

  // A tour already listed under the guide should not reappear as a suggestion.
  const guideTourIds = new Set(guide.tours.map((item) => item.id));

  return (
    <TourDetailClient
      locale={locale}
      tour={tour}
      similarTours={similarTours.filter((similar) => !guideTourIds.has(similar.id))}
      reviews={reviews}
      guideStory={guide.story}
      guideTours={guide.tours}
    />
  );
}
