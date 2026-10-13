import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface IStoreReview {
  _id?: string;
  id?: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  link?: string;
  avatarUrl?: string;
}

export function useStoreReviews() {
  return useInfiniteQuery({
    queryKey: ["store-reviews"],
    queryFn: async ({ pageParam = "" }) => {
      try {
        const url = pageParam ? `/reviews/store?token=${pageParam}` : `/reviews/store`;
        const response = await apiClient.get<{ data: IStoreReview[]; nextToken?: string | null }>(url);
        return {
          data: response.data.data || [],
          nextToken: response.data.nextToken || null,
        };
      } catch {
        // Fallback to Next.js route proxy if direct API call fails
        try {
          const proxyUrl = pageParam ? `/api/reviews/store?token=${pageParam}` : `/api/reviews/store`;
          const res = await fetch(proxyUrl);
          const json = await res.json();
          return {
            data: (json?.data as IStoreReview[]) || [],
            nextToken: (json?.nextToken as string | null) || null,
          };
        } catch {
          return {
            data: [],
            nextToken: null,
          };
        }
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextToken || undefined,
    initialPageParam: "",
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}
