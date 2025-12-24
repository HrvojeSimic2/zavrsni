export type TourCategory = "food" | "nature" | "culture" | "adventure" | "history";

export interface GuideProfile {
  id: string;
  name: string;
  avatar: string | null;
  languages: string[];
  verified: boolean;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  category: TourCategory;
  location: string;
  country: string;  
  price: number;
  duration: string;
  rating: number;
  reviewCount: number;
  image: string | null;
  guide: GuideProfile;
  groupSize: string;
  highlights: string[];
}
