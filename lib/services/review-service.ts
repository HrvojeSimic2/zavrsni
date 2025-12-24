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

export async function fetchReviewsByTourId(tourId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author, avatar, rating, date, comment, helpful")
    .eq("tour_id", tourId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return (data ?? []).map((review) => ({
    id: review.id,
    author: review.author,
    avatar: review.avatar,
    rating: review.rating ?? 0,
    date: review.date ?? "",
    comment: review.comment,
    helpful: review.helpful ?? 0,
  }));
}
