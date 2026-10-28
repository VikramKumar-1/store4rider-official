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

export function useStoreReviews(options?: {
  random?: boolean;
  limit?: number;
  excludeIds?: string[];
}) {
  const isRandom = options?.random ?? false;
  const limit = options?.limit ?? 10;
  const excludeIds = options?.excludeIds ?? [];
  const excludeKey = excludeIds.slice().sort().join(",");

  return useInfiniteQuery({
    queryKey: ["store-reviews", { random: isRandom, limit, exclude: excludeKey }],
    queryFn: async ({ pageParam = "" }) => {
      const qParams = new URLSearchParams();
      if (pageParam) qParams.set("token", pageParam);
      if (isRandom) qParams.set("random", "true");
      if (limit) qParams.set("limit", String(limit));
      if (excludeIds.length > 0) qParams.set("exclude", excludeIds.join(","));
      const qs = qParams.toString() ? `?${qParams.toString()}` : "";

      try {
        const url = `/reviews/store${qs}`;
        const response = await apiClient.get<{ data: IStoreReview[]; nextToken?: string | null }>(url);
        return {
          data: response.data.data || [],
          nextToken: response.data.nextToken || null,
        };
      } catch {
        // Fallback to Next.js route proxy if direct API call fails
        try {
          const proxyUrl = `/api/reviews/store${qs}`;
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
    staleTime: isRandom ? 0 : 1000 * 60 * 30, // Fresh random sampling on fresh visits
  });
}
