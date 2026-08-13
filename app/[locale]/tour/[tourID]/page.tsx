import { notFound } from "next/navigation";

import TourDetailClient from "@/components/tour/tour-detail-client";
import { fetchSimilarTours, fetchTourById } from "@/lib/services/tour-service";
import { fetchReviewsByTourId } from "@/lib/services/review-service";

export default async function TourDetailPage({
  params,
}: {
  params: { locale: string; tourID: string } | Promise<{ locale: string; tourID: string }>;
}) {
  const { locale, tourID } = await Promise.resolve(params);

  const tour = await fetchTourById(tourID);
  if (!tour) notFound();

  const [similarTours, reviews] = await Promise.all([
    fetchSimilarTours(tour.category, tour.id).catch(() => []),
    // Reviews are secondary to the page: a failure here should not 500 a tour.
    fetchReviewsByTourId(tour.id).catch((error) => {
      console.warn("[tour.detail] failed to load reviews", error);
      return [];
    }),
  ]);

  return (
    <TourDetailClient
      locale={locale}
      tour={tour}
      similarTours={similarTours}
      reviews={reviews}
    />
  );
}
