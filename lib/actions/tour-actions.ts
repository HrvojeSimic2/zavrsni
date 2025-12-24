"use server";

import {
  fetchSimilarTours,
  fetchTourById,
  fetchTours,
} from "@/lib/services/tour-service";
import { TourCategory } from "@/lib/types/tour";

export async function getTours() {
  return fetchTours();
}

export async function getTourById(tourId: string) {
  return fetchTourById(tourId);
}

export async function getSimilarTours(
  category: TourCategory,
  excludeId: string,
  limit?: number
) {
  return fetchSimilarTours(category, excludeId, limit);
}
