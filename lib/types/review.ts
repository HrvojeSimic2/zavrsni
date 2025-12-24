export interface Review {
  id: string;
  author: string;
  avatar: string | null;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
}
