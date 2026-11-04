import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { ISearchRedirect, ISearchRedirectCheckResult } from "@store4riders/shared-types";

export interface TrendingSearchResponse {
  trending: string[];
  categories: {
    name: string;
    slug: string;
  }[];
}

export interface SearchSuggestProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  image?: string;
  thumbnail?: string;
  basePrice: number;
  specialPrice: number;
  inStock: boolean;
}

export interface SearchSuggestCategory {
  id: string;
  name: string;
  slug: string;
  url?: string;
}

export interface ScopedSuggestion {
  type: "category" | "brand";
  label: string;
  query: string;
  categorySlug?: string;
  categoryName?: string;
  brand?: string;
}

export interface SearchSuggestResponse {
  products: SearchSuggestProduct[];
  categories: SearchSuggestCategory[];
  brands: string[];
  scopedSuggestions?: ScopedSuggestion[];
  redirect?: {
    url: string;
    title: string;
    type: string;
  } | null;
  isCorrected?: boolean;
  correctedQuery?: string;
}

/**
 * Hook to fetch dynamic popular/trending searches and quick categories
 */
export function useTrendingSearches() {
  return useQuery<TrendingSearchResponse>({
    queryKey: ["search", "trending"],
    queryFn: async () => {
      const response = await apiClient.get("/search/trending");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook for live autocomplete suggestions with typo tolerance and category/brand discovery
 */
export function useSearchSuggestions(query: string) {
  const trimmed = query.trim();
  return useQuery<SearchSuggestResponse>({
    queryKey: ["search", "suggest", trimmed],
    queryFn: async () => {
      const response = await apiClient.get(`/search/suggest?q=${encodeURIComponent(trimmed)}`);
      return response.data.data;
    },
    enabled: trimmed.length >= 2,
    staleTime: 60 * 1000,
  });
}

/**
 * Check if a specific query has an active redirect
 */
export async function checkSearchRedirect(query: string): Promise<ISearchRedirectCheckResult> {
  const trimmed = query.trim();
  if (!trimmed) return { hasRedirect: false };
  try {
    const res = await apiClient.get(`/search/redirect?q=${encodeURIComponent(trimmed)}`);
    return res.data.data;
  } catch {
    return { hasRedirect: false };
  }
}

/**
 * Admin: Fetch paginated list of search redirect rules
 */
export function useSearchRedirects(page = 1, limit = 20, search?: string) {
  return useQuery<{ items: ISearchRedirect[]; totalCount: number; totalPages: number }>({
    queryKey: ["admin", "search-redirects", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (search && search.trim()) params.set("search", search.trim());

      const res = await apiClient.get(`/search/redirects?${params.toString()}`);
      return res.data.data;
    },
  });
}

/**
 * Admin: Create a new search redirect
 */
export function useCreateSearchRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ISearchRedirect>) => {
      const res = await apiClient.post("/search/redirects", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "search-redirects"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

/**
 * Admin: Update existing search redirect
 */
export function useUpdateSearchRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ISearchRedirect> }) => {
      const res = await apiClient.put(`/search/redirects/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "search-redirects"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

/**
 * Admin: Delete a search redirect
 */
export function useDeleteSearchRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/search/redirects/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "search-redirects"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}
