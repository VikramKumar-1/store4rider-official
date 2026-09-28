import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface IStoreReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  link: string;
}

export function useStoreReviews() {
  return useQuery({
    queryKey: ["store-reviews"],
    queryFn: async () => {
      // Calls our new Next.js API route which handles the scraping
      const response = await axios.get("/api/reviews/store");
      return response.data.data as IStoreReview[];
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours to minimize API calls
  });
}
