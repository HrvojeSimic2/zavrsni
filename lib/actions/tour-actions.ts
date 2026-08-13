"use server";

import {
  fetchSimilarTours,
  fetchTourById,
  fetchTours,
} from "@/lib/services/tour-service";
import type { Tour, TourCategory } from "@/lib/types/tour";

export type BrowseSort = "popular" | "rating" | "name";

export type BrowseToursFiltersInput = {
  q?: string | null;
  category?: string | null;
  country?: string | null;
  language?: string | null;
  sort?: string | null;
  page?: string | null;
};

export type BrowseToursFilters = {
  q: string;
  category: "all" | TourCategory;
  country: "all" | string;
  language: "all" | string;
  sort: BrowseSort;
};

export async function getTours() {
  return fetchTours();
}

function normalizeBrowseSort(value: string | null | undefined): BrowseSort {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "rating") return "rating";
  if (normalized === "name") return "name";
  return "popular";
}

function normalizeBrowseCategory(
  value: string | null | undefined
): "all" | TourCategory {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "all") return "all";
  if (
    normalized === "food" ||
    normalized === "nature" ||
    normalized === "culture" ||
    normalized === "adventure" ||
    normalized === "history"
  ) {
    return normalized;
  }
  return "all";
}

function normalizeBrowseValue(
  value: string | null | undefined,
  maxLength = 120
): string {
  return (value ?? "").trim().slice(0, maxLength);
}

function normalizeBrowsePage(value: string | null | undefined): number {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 9999);
}

function applyBrowseFilters(tours: Tour[], filters: BrowseToursFilters): Tour[] {
  const query = filters.q.trim().toLowerCase();

  let filtered = tours;

  if (query) {
    filtered = filtered.filter(
      (tour) =>
        tour.title.toLowerCase().includes(query) ||
        tour.description.toLowerCase().includes(query) ||
        tour.location.toLowerCase().includes(query) ||
        tour.guide.name.toLowerCase().includes(query) ||
        tour.guide.languages.some((language) =>
          language.toLowerCase().includes(query)
        )
    );
  }

  if (filters.category !== "all") {
    filtered = filtered.filter((tour) => tour.category === filters.category);
  }

  if (filters.country !== "all") {
    filtered = filtered.filter((tour) => tour.country === filters.country);
  }

  if (filters.language !== "all") {
    filtered = filtered.filter((tour) =>
      tour.guide.languages.includes(filters.language)
    );
  }

  const sorted = [...filtered];

  if (filters.sort === "popular") {
    sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (filters.sort === "rating") {
    sorted.sort((a, b) => b.rating - a.rating);
  } else if (filters.sort === "name") {
    sorted.sort((a, b) => a.guide.name.localeCompare(b.guide.name));
  }

  return sorted;
}

type BrowseToursData = {
  tours: Tour[];
  countries: string[];
  languages: string[];
  filters: BrowseToursFilters;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    from: number;
    to: number;
  };
};

export async function getBrowseToursData(
  input: BrowseToursFiltersInput = {}
): Promise<BrowseToursData> {
  const allTours = await fetchTours();

  const countries = Array.from(
    new Set(
      allTours
        .map((tour) => tour.country.trim())
        .filter((country) => Boolean(country))
    )
  ).sort((a, b) => a.localeCompare(b));

  const languages = Array.from(
    new Set(
      allTours
        .flatMap((tour) => tour.guide.languages)
        .map((language) => language.trim())
        .filter((language) => Boolean(language))
    )
  ).sort((a, b) => a.localeCompare(b));

  const requestedCountry = normalizeBrowseValue(input.country);
  const requestedLanguage = normalizeBrowseValue(input.language);

  const canonicalCountry =
    !requestedCountry || requestedCountry.toLowerCase() === "all"
      ? "all"
      : countries.find(
            (country) => country.toLowerCase() === requestedCountry.toLowerCase()
          ) ?? "all";

  const canonicalLanguage =
    !requestedLanguage || requestedLanguage.toLowerCase() === "all"
      ? "all"
      : languages.find(
            (language) =>
              language.toLowerCase() === requestedLanguage.toLowerCase()
          ) ?? "all";

  const filters: BrowseToursFilters = {
    q: normalizeBrowseValue(input.q, 200),
    category: normalizeBrowseCategory(input.category),
    country: canonicalCountry,
    language: canonicalLanguage,
    sort: normalizeBrowseSort(input.sort),
  };

  const filteredTours = applyBrowseFilters(allTours, filters);
  const pageSize = 12;
  const totalCount = filteredTours.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const requestedPage = normalizeBrowsePage(input.page);
  const page = Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const endExclusive = startIndex + pageSize;
  const pagedTours = filteredTours.slice(startIndex, endExclusive);
  const from = totalCount === 0 ? 0 : startIndex + 1;
  const to = Math.min(totalCount, endExclusive);

  return {
    tours: pagedTours,
    countries,
    languages,
    filters,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      from,
      to,
    },
  };
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
