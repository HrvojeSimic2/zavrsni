import type { TourCategory } from "@/lib/types/tour";

export type GuideInterest = TourCategory;

export type GuideBrowseSort =
  | "match"
  | "rating"
  | "reviews"
  | "availability"
  | "name";

export type GuideBrowseItem = {
  id: string;
  name: string;
  avatar: string | null;
  languages: string[];
  verified: boolean;
  location: string;
  interests: GuideInterest[];
  rating: number;
  reviewCount: number;
  availableToday: boolean;
  nextAvailableDate: string | null;
};

