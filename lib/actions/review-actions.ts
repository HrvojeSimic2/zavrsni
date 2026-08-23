"use server";

import { fetchReviewsByGuideId } from "@/lib/services/review-service";

export async function getReviewsByGuideId(guideId: string) {
  return fetchReviewsByGuideId(guideId);
}
