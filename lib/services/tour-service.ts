import { createClient } from "@/lib/supabase/server";
import { Tour, TourCategory } from "@/lib/types/tour";

type GuideRow = {
  id: string;
  name: string;
  avatar: string | null;
  languages: string[] | null;
  verified: boolean | null;
};

type TourRow = {
  id: string;
  title: string;
  description: string;
  category: TourCategory;
  location: string;
  country: string;
  price: number | null;
  duration: string | null;
  rating: number | null;
  review_count: number | null;
  image: string | null;
  group_size: string | null;
  highlights: string[] | null;
  guide: GuideRow[] | GuideRow | null;
};

const tourSelect =
  "id, title, description, category, location, country, price, duration, rating, review_count, image, group_size, highlights, guide:guides ( id, name, avatar, languages, verified )";

const mapTourRow = (row: TourRow): Tour => {
  const guideRow = Array.isArray(row.guide) ? row.guide[0] : row.guide;
  const guide = guideRow ?? {
    id: "",
    name: "Unknown guide",
    avatar: null,
    languages: [],
    verified: false,
  };

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    country: row.country,
    price: row.price ?? 0,
    duration: row.duration ?? "",
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    image: row.image,
    guide: {
      id: guide.id,
      name: guide.name,
      avatar: guide.avatar,
      languages: guide.languages ?? [],
      verified: guide.verified ?? false,
    },
    groupSize: row.group_size ?? "",
    highlights: row.highlights ?? [],
  }; 
};

export async function fetchTours(): Promise<Tour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select(tourSelect) 
    .order("title", { ascending: true });
  if (error) {
    throw new Error(`Failed to fetch tours: ${error.message}`);
  }

  return (data ?? []).map(mapTourRow);
}

export async function fetchTourById(tourId: string): Promise<Tour | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select(tourSelect)
    .eq("id", tourId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch tour: ${error.message}`);
  }

  return data ? mapTourRow(data) : null;
}

export async function fetchSimilarTours(
  category: TourCategory,
  excludeId: string,
  limit = 3
): Promise<Tour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select(tourSelect)
    .eq("category", category)
    .neq("id", excludeId)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch similar tours: ${error.message}`);
  }

  return (data ?? []).map(mapTourRow);
}
