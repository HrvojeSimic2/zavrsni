import { createClient } from "@/lib/supabase/server";
import { Review } from "@/lib/types/review";

type ReviewRow = {
  id: string;
  author: string;
  avatar: string | null;
  rating: number | null;
  date: string | null;
  comment: string;
  helpful: number | null;
};

/**
 * Reviews are about the guide, not about a product they once listed. A traveller
 * writes about the person who showed them around.
 */
export async function fetchReviewsByGuideId(guideId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author, avatar, rating, date, comment, helpful")
    .eq("guide_id", guideId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return ((data ?? []) as ReviewRow[]).map((review) => ({
    id: review.id,
    author: review.author,
    avatar: review.avatar,
    rating: review.rating ?? 0,
    date: review.date ?? "",
    comment: review.comment,
    helpful: review.helpful ?? 0,
  }));
}
