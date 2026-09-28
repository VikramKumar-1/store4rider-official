import { useInfiniteQuery } from "@tanstack/react-query";
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
  return useInfiniteQuery({
    queryKey: ["store-reviews"],
    queryFn: async ({ pageParam = "" }) => {
      const url = pageParam ? `/api/reviews/store?token=${pageParam}` : `/api/reviews/store`;
      const response = await axios.get(url);
      return {
        data: response.data.data as IStoreReview[],
        nextToken: response.data.nextToken as string | null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextToken || undefined,
    initialPageParam: "",
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });
}
