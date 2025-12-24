"use server";

import { fetchReviewsByTourId } from "@/lib/services/review-service";

export async function getReviewsByTourId(tourId: string) {
  return fetchReviewsByTourId(tourId);
}
