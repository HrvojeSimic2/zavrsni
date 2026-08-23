import type { Specialty } from "@/lib/types/specialty";

/** Kept as an alias so the browse UI can keep saying "interests". */
export type GuideInterest = Specialty;

export type GuideBrowseSort =
  | "match"
  | "rating"
  | "reviews"
  | "availability"
  | "rate"
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
  /** EUR per hour, or null while the guide has not published a rate. */
  hourlyRate: number | null;
  maxGroupSize: number;
  availableToday: boolean;
  nextAvailableDate: string | null;
  openSlotCount: number;
};
