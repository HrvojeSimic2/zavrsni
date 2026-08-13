"use server";

import type {
  GuideBrowseItem,
  GuideBrowseSort,
  GuideInterest,
} from "@/lib/types/guide";
import { fetchGuidesBrowseItems } from "@/lib/services/guide-service";

export type BrowseGuidesFiltersInput = {
  q?: string | null;
  interest?: string | null;
  where?: string | null;
  language?: string | null;
  available?: string | null;
  verified?: string | null;
  sort?: string | null;
  page?: string | null;
};

export type BrowseGuidesFilters = {
  q: string;
  interest: "all" | GuideInterest;
  where: string;
  language: "all" | string;
  available: "any" | "today";
  verified: boolean;
  sort: GuideBrowseSort;
};

function normalizeText(value: string | null | undefined, maxLength = 120) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeInterest(value: string | null | undefined): "all" | GuideInterest {
  const normalized = normalizeText(value, 32).toLowerCase();
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

function normalizeSort(value: string | null | undefined): GuideBrowseSort {
  const normalized = normalizeText(value, 32).toLowerCase();
  if (normalized === "rating") return "rating";
  if (normalized === "reviews") return "reviews";
  if (normalized === "availability") return "availability";
  if (normalized === "name") return "name";
  return "match";
}

function normalizeAvailable(value: string | null | undefined): "any" | "today" {
  const normalized = normalizeText(value, 16).toLowerCase();
  if (normalized === "today" || normalized === "1" || normalized === "true")
    return "today";
  return "any";
}

function normalizeVerified(value: string | null | undefined): boolean {
  const normalized = normalizeText(value, 16).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function normalizePage(value: string | null | undefined): number {
  const parsed = Number.parseInt(normalizeText(value, 16), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 9999);
}

function includesLoose(haystack: string, needle: string) {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function computeMatchScore(guide: GuideBrowseItem, filters: BrowseGuidesFilters) {
  const q = filters.q.trim().toLowerCase();
  const where = filters.where.trim().toLowerCase();
  const interest = filters.interest;
  const language = filters.language;

  let score = 0;

  if (filters.verified && guide.verified) score += 1;
  if (filters.available === "today" && guide.availableToday) score += 2;

  if (interest !== "all" && guide.interests.includes(interest)) {
    score += 3;
  }

  if (language !== "all" && guide.languages.includes(language)) {
    score += 2;
  }

  if (where && guide.location.toLowerCase().includes(where)) score += 3;

  if (q) {
    const blob = [
      guide.name,
      guide.location,
      guide.languages.join(" "),
      guide.interests.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    if (blob.includes(q)) score += 2;
  }

  score += Math.min(2, guide.rating / 2.5);
  score += Math.min(2, Math.log10(Math.max(1, guide.reviewCount + 1)));

  return score;
}

function applyFilters(guides: GuideBrowseItem[], filters: BrowseGuidesFilters) {
  const q = filters.q.trim().toLowerCase();
  const where = filters.where.trim().toLowerCase();
  const interest = filters.interest;
  const language = filters.language;

  let filtered = guides;

  if (q) {
    filtered = filtered.filter((guide) => {
      const blob = [
        guide.name,
        guide.location,
        guide.languages.join(" "),
        guide.interests.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  if (interest !== "all") {
    filtered = filtered.filter((guide) => guide.interests.includes(interest));
  }

  if (language !== "all") {
    filtered = filtered.filter((guide) => guide.languages.includes(language));
  }

  if (where) {
    filtered = filtered.filter((guide) => includesLoose(guide.location, where));
  }

  if (filters.available === "today") {
    filtered = filtered.filter((guide) => guide.availableToday);
  }

  if (filters.verified) {
    filtered = filtered.filter((guide) => guide.verified);
  }

  const sorted = [...filtered];

  if (filters.sort === "match") {
    sorted.sort((a, b) => computeMatchScore(b, filters) - computeMatchScore(a, filters));
  } else if (filters.sort === "rating") {
    sorted.sort((a, b) => b.rating - a.rating);
  } else if (filters.sort === "reviews") {
    sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (filters.sort === "availability") {
    sorted.sort((a, b) => {
      const aKey = a.availableToday ? "0000-00-00" : a.nextAvailableDate ?? "9999-99-99";
      const bKey = b.availableToday ? "0000-00-00" : b.nextAvailableDate ?? "9999-99-99";
      return aKey.localeCompare(bKey);
    });
  } else if (filters.sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

type BrowseGuidesData = {
  guides: GuideBrowseItem[];
  languages: string[];
  filters: BrowseGuidesFilters;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    from: number;
    to: number;
  };
};

export async function getBrowseGuidesData(
  input: BrowseGuidesFiltersInput = {}
): Promise<BrowseGuidesData> {
  const allGuides = await fetchGuidesBrowseItems();

  const languages = Array.from(
    new Set(
      allGuides
        .flatMap((guide) => guide.languages)
        .map((language) => language.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const requestedLanguage = normalizeText(input.language);
  const canonicalLanguage =
    !requestedLanguage || requestedLanguage.toLowerCase() === "all"
      ? "all"
      : languages.find(
            (language) => language.toLowerCase() === requestedLanguage.toLowerCase()
          ) ?? "all";

  const filters: BrowseGuidesFilters = {
    q: normalizeText(input.q, 200),
    interest: normalizeInterest(input.interest),
    where: normalizeText(input.where, 120),
    language: canonicalLanguage,
    available: normalizeAvailable(input.available),
    verified: normalizeVerified(input.verified),
    sort: normalizeSort(input.sort),
  };

  const filteredGuides = applyFilters(allGuides, filters);
  const pageSize = 12;
  const totalCount = filteredGuides.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const requestedPage = normalizePage(input.page);
  const page = Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const endExclusive = startIndex + pageSize;
  const paged = filteredGuides.slice(startIndex, endExclusive);
  const from = totalCount === 0 ? 0 : startIndex + 1;
  const to = Math.min(totalCount, endExclusive);

  return {
    guides: paged,
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

export async function getHomepageGuidesData() {
  const allGuides = await fetchGuidesBrowseItems({ windowDays: 30 });
  const sorted = [...allGuides].sort((a, b) => {
    const aKey = a.availableToday ? 1 : 0;
    const bKey = b.availableToday ? 1 : 0;
    if (aKey !== bKey) return bKey - aKey;
    if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
    return b.rating - a.rating;
  });

  return sorted.slice(0, 18);
}
